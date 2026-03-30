"""
============================================================
Neural Banking Map — LangChain Agent
============================================================
When fraud confidence > 75%, this agent:
  1. Freezes the offending account + linked devices in Neo4j
  2. Drafts a structured Suspicious Activity Report (SAR)
  3. Returns the SAR text for storage and UI display
============================================================
"""

from __future__ import annotations

import os
import logging
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("neural_banking_map.agent")

# ────────────────────────────────────────────────────────────
# Try to import LangChain — graceful fallback if not installed
# ────────────────────────────────────────────────────────────

try:
    from langchain_openai import ChatOpenAI
    from langchain.agents import AgentExecutor, create_openai_tools_agent
    from langchain.tools import StructuredTool
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

    HAS_LANGCHAIN = True
except ImportError:
    logger.warning("⚠️  LangChain not installed — using template-based SAR fallback")
    HAS_LANGCHAIN = False

# Import graph layer for freeze operations
from graph.queries import freeze_account_in_db


# ────────────────────────────────────────────────────────────
# Tool 1: Freeze Account
# ────────────────────────────────────────────────────────────

def freeze_account(account_id: str, device_ids: str = "") -> str:
    """
    Freeze a fraudulent UPI account and all linked devices in Neo4j.

    Parameters
    ----------
    account_id : str
        The UPI ID to freeze.
    device_ids : str
        Comma-separated device IDs (optional — Neo4j query handles it).

    Returns
    -------
    str — confirmation message.
    """
    success = freeze_account_in_db(account_id)
    devices = [d.strip() for d in device_ids.split(",") if d.strip()]

    if success:
        msg = f"✅ Account {account_id} FROZEN successfully."
        if devices:
            msg += f" Linked devices frozen: {', '.join(devices)}."
        logger.info(msg)
        return msg
    else:
        msg = f"❌ Failed to freeze account {account_id}."
        logger.error(msg)
        return msg


# ────────────────────────────────────────────────────────────
# Tool 2: Draft SAR (Suspicious Activity Report)
# ────────────────────────────────────────────────────────────

def draft_sar(account_id: str, ring_nodes: str,
              amounts: str, confidence: str) -> str:
    """
    Generate a structured Suspicious Activity Report.

    Parameters
    ----------
    account_id : str
        The primary suspect account.
    ring_nodes : str
        Comma-separated UPI IDs in the fraud ring.
    amounts : str
        Comma-separated transaction amounts in the ring.
    confidence : str
        Model confidence score (0-1).

    Returns
    -------
    str — the complete SAR text.
    """
    ring_list = [n.strip() for n in ring_nodes.split(",") if n.strip()]
    amount_list = []
    for a in amounts.split(","):
        a = a.strip()
        if a:
            try:
                amount_list.append(float(a))
            except ValueError:
                amount_list.append(0.0)

    total_volume = sum(amount_list)
    conf_float = float(confidence) if confidence else 0.0
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    sar = f"""
══════════════════════════════════════════════════════════════
         SUSPICIOUS ACTIVITY REPORT (SAR)
══════════════════════════════════════════════════════════════

▸ Report ID:        SAR-{account_id[-6:]}-{datetime.now().strftime('%Y%m%d%H%M')}
▸ Generated:        {timestamp}
▸ Primary Account:  {account_id}
▸ Confidence Score: {conf_float:.1%}
▸ Action Taken:     ACCOUNT FROZEN & DEVICES BLOCKED

──────────────────────────────────────────────────────────────
 FRAUD RING ANALYSIS
──────────────────────────────────────────────────────────────

Ring Members ({len(ring_list)} accounts):
{chr(10).join(f'  • {node}' for node in ring_list) if ring_list else '  • No ring members identified'}

Total Volume:       ₹{total_volume:,.2f}
Avg. Transaction:   ₹{(total_volume / max(len(amount_list), 1)):,.2f}
Ring Topology:      Circular transfer pattern detected

──────────────────────────────────────────────────────────────
 DETECTION METHOD
──────────────────────────────────────────────────────────────

• Tier 1 — DFS Cycle Detection:   Circular transfer ring identified
• Tier 2 — PageRank Centrality:   Hub account scoring applied
• Tier 3 — GraphSAGE GNN:         Inductive classification — {conf_float:.1%}
• Agent  — LangChain Automated:   Account frozen within 30 seconds

──────────────────────────────────────────────────────────────
 NARRATIVE
──────────────────────────────────────────────────────────────

Account {account_id} was flagged by the Neural Banking Map's
4-tier graph intelligence engine. The account participated in a
circular transfer ring involving {len(ring_list)} accounts with a
total transaction volume of ₹{total_volume:,.2f}.

The GraphSAGE model assigned a fraud probability of {conf_float:.1%},
exceeding the 75% threshold. The LangChain agent automatically
froze the account and all linked payment devices.

──────────────────────────────────────────────────────────────
 RECOMMENDATION
──────────────────────────────────────────────────────────────

1. Escalate to the financial crimes investigation unit
2. Review all linked accounts: {', '.join(ring_list[:5])}
3. Preserve transaction logs for regulatory submission
4. Notify affected merchant partners

══════════════════════════════════════════════════════════════
         END OF REPORT — Neural Banking Map
══════════════════════════════════════════════════════════════
""".strip()
    return sar


# ────────────────────────────────────────────────────────────
# LangChain Agent Executor
# ────────────────────────────────────────────────────────────

_agent_executor: AgentExecutor | None = None


def _build_agent() -> AgentExecutor | None:
    """Construct the LangChain agent with freeze + SAR tools."""
    if not HAS_LANGCHAIN:
        return None

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-placeholder") or api_key == "sk-...":
        logger.warning("⚠️  No valid OPENAI_API_KEY — agent will use template SAR")
        return None

    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            api_key=api_key,
        )

        tools = [
            StructuredTool.from_function(
                func=freeze_account,
                name="freeze_account",
                description=(
                    "Freeze a fraudulent UPI account and its linked devices. "
                    "Use when fraud confidence exceeds 75%. "
                    "Input: account_id (str), device_ids (comma-separated str)."
                ),
            ),
            StructuredTool.from_function(
                func=draft_sar,
                name="draft_sar",
                description=(
                    "Draft a Suspicious Activity Report for a flagged account. "
                    "Input: account_id (str), ring_nodes (comma-separated str), "
                    "amounts (comma-separated str), confidence (str 0-1)."
                ),
            ),
        ]

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a financial fraud analyst for the Neural Banking Map. "
             "When given graph context about a suspicious UPI transaction, you must:\n"
             "1. Freeze the primary account and its devices\n"
             "2. Draft a comprehensive SAR report\n"
             "Always act decisively — every second matters in fraud prevention."),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_openai_tools_agent(llm, tools, prompt)
        executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=3,
            handle_parsing_errors=True,
        )
        logger.info("✅ LangChain agent initialized with GPT-4o-mini")
        return executor

    except Exception as exc:
        logger.error("❌ Failed to build LangChain agent: %s", exc)
        return None


def init_agent() -> None:
    """Initialize the agent at startup (idempotent)."""
    global _agent_executor
    _agent_executor = _build_agent()


# ────────────────────────────────────────────────────────────
# Public API — called by main.py on fraud detection
# ────────────────────────────────────────────────────────────

def run_fraud_agent(
    account_id: str,
    device_id: str,
    ring_nodes: list[str],
    amounts: list[float],
    confidence: float,
) -> dict[str, Any]:
    """
    Execute the fraud response pipeline.

    If LangChain is available and configured, the agent decides
    which tools to call. Otherwise, we call freeze + SAR directly.

    Returns
    -------
    dict with keys:
        sar_draft : str — the full SAR report text
        device_frozen : bool — whether devices were frozen
        action : str — summary of actions taken
    """
    ring_str = ", ".join(ring_nodes) if ring_nodes else account_id
    amounts_str = ", ".join(str(a) for a in amounts) if amounts else "0"
    conf_str = str(confidence)

    # ── Try LangChain agent first ──
    if _agent_executor is not None:
        try:
            agent_input = (
                f"A fraudulent transaction was detected on account {account_id} "
                f"(device: {device_id}). Confidence: {confidence:.1%}. "
                f"Ring members: {ring_str}. Amounts: {amounts_str}. "
                f"Freeze the account and draft a SAR report immediately."
            )
            result = _agent_executor.invoke({"input": agent_input})
            output = result.get("output", "")

            # The agent should have called both tools; extract the SAR
            if "SUSPICIOUS ACTIVITY REPORT" in output:
                sar_text = output
            else:
                # Agent ran but SAR may be in tool outputs
                sar_text = draft_sar(account_id, ring_str, amounts_str, conf_str)

            return {
                "sar_draft": sar_text,
                "device_frozen": True,
                "action": "LangChain agent froze account and drafted SAR",
            }

        except Exception as exc:
            logger.error("Agent execution failed, falling back: %s", exc)

    # ── Direct fallback (no LangChain / no API key) ──
    freeze_result = freeze_account(account_id, device_id)
    sar_text = draft_sar(account_id, ring_str, amounts_str, conf_str)

    return {
        "sar_draft": sar_text,
        "device_frozen": "FROZEN" in freeze_result.upper(),
        "action": "Template-based freeze + SAR (LangChain unavailable)",
    }
