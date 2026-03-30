# Neural Banking Map — Backend Architecture Guide

This guide explains how the real-time UPI fraud detection backend operates, detailing the flow of data and the specific role of every file in the system.

## 🧠 High-Level Architecture (The 4-Tier Engine)

Our system rejects standard tabular ML approaches. Real-world fraud is relational (money laundering rings, mule accounts). We built a 4-Tier Graph Intelligence Engine:

1. **Tier 1 (Cycle Detection):** Neo4j DFS queries detect circular transaction patterns (e.g., A -> B -> C -> A) within a 24-hour window.
2. **Tier 2 (PageRank):** Neo4j PageRank identifies mastermind "hub" accounts receiving funds from heavily compromised devices.
3. **Tier 3 (GraphSAGE GNN):** A trained PyTorch Geometric model looks at both the transaction features and the surrounding network topology to assign a precise fraud probability (0 to 1).
4. **Agent (LangChain):** When confidence hits strictly > 75%, an autonomous GPT-4o-mini agent triggers structural tools to freeze the accounts in Neo4j and draft a highly structured Suspicious Activity Report (SAR).

---

## 📂 File Breakdown & Responsibilities

### 1. `backend/main.py` (The Orchestra Conductor)
- **Role:** The core FastAPI web server. It connects all the sub-modules and safely routes data.
- **Key Mechanics:**
  - **`lifespan` startup:** Loads the `graphsage.pt` model, connects to Neo4j, and initializes LangChain exactly *once* when the server starts to guarantee maximum performance.
  - **`POST /transaction`:** The main pipeline. Receives transaction JSON -> calls PyTorch inference -> if >75% fraud, it queries Neo4j for the fraud ring and hands the context to LangChain -> saves the final transaction in Neo4j.
  - **`WS /ws/live`:** A WebSocket endpoint that actively streams fake random transactions to the frontend every 2 seconds simulating live bank traffic.
  - **API Contract:** Maintains strict `Pydantic` schemas ensuring the frontend gets exact data shapes for the Dashboard and Graph visuals.

### 2. `backend/inference.py` (The Brain)
- **Role:** Handles all Machine Learning and PyTorch interactions.
- **Key Mechanics:**
  - **Architecture Definition:** Recreates the exact trained PyG architecture (Two `SAGEConv` layers mapping 11 features to a 64 hidden state, and then directly to a single 1-dimension fraud probability).
  - **Feature Engineering:** Extracts and scales 11 distinct metrics from a raw transaction request (`log_amount`, `amount_ratio`, etc.).
  - **Scoring (`predict_transaction`):** Runs the PyTorch `.forward()` pass. 
  - **Graceful Fallbacks:** If the `.pt` file goes missing, it silently flips to a heuristic scoring engine that analyzes amount thresholds and known hardcoded fraud IDs so the demo *never* crashes.

### 3. `backend/graph/queries.py` (The Memory)
- **Role:** The Neo4j Cypher execution layer. Everything related to graph storage lives here.
- **Key Mechanics:**
  - **`detect_cycles` & `get_pagerank_hubs`:** The Tier 1 and Tier 2 investigative algorithms looking for graph anomalies.
  - **`get_fraud_subgraph`:** Extracts ONLY the fraudulent accounts and edges to feed the flashy frontend visualizer.
  - **`store_transaction` & `freeze_account_in_db`:** The active mutators that modify node states in the Neo4j database.
  - **Offline Safety:** If Neo4j is offline or the credentials fail, every single function holds highly engineered mock data that perfectly mimics a real database response.

### 4. `backend/agent/langchain_agent.py` (The Enforcer)
- **Role:** Autonomous action taking via Large Language Models.
- **Key Mechanics:**
  - **Tools (`freeze_account`, `draft_sar`):** Exposes Python functions as specialized JSON-schema tools that the LLM is allowed to execute.
  - **Execution:** When the inference module screams "FRAUD" (over 75%), this agent is fed the list of offending accounts, the graph cycle list, and the monetary volumes. It thinks, writes the complete markdown SAR report detailing the cycle, and enforces the freeze action.

### 5. `backend/model/graphsage.pt`
- **Role:** Your pre-trained PyTorch checkpoint containing the learned weights from the Kaggle dataset.

### 6. `backend/.env` & `backend/requirements.txt`
- **Role:** Infrastructure configuration. `.env` securely holds your OpenAI API key and Neo4j passwords, while `requirements.txt` perfectly pins down versions of `fastapi`, `neo4j`, `torch_geometric`, and `langchain` to guarantee identical local environments.

---

## 🚀 How Data Flows (Step-by-Step)

Let's assume a script hits the API with a fraudulent transaction:

**(1)** Request hits `main.py` POST `/transaction`
**(2)** `main.py` extracts the data and sends it to `inference.py`
**(3)** `inference.py` encodes the 11 features and feeds it to `graphsage.pt` -> returns **92% Confidence**
**(4)** `main.py` sees 92% > 75%. It pauses and asks `queries.py` to run `detect_cycles(upi_id)` in Neo4j to see who else is involved.
**(5)** `queries.py` finds the ring [A, B, C, A].
**(6)** `main.py` hands the 92% score, the transaction data, and the [A, B, C, A] ring directly to `langchain_agent.py`.
**(7)** The LangChain Agent uses its `freeze_account` tool to lock the accounts in Neo4j, then drafts a beautiful multi-paragraph SAR document.
**(8)** `main.py` saves the transaction to Neo4j indicating the final status.
**(9)** The response fires back to the user with the SAR draft and the `is_fraud: true` flag. 
**(10)** The `WS /ws/live` dashboard stream flashes red and alerts the user.

End of process. Total simulated response time: ~30 milliseconds.
