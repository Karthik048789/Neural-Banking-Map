"""
============================================================
Neural Banking Map — Neo4j Cypher Query Functions
============================================================
All graph database interactions live here.
Every function has a mock fallback so the app works without Neo4j.
============================================================
"""

from __future__ import annotations

import os
import random
import logging
from datetime import datetime, timedelta
from typing import Any

from neo4j import GraphDatabase, Driver
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("neural_banking_map.graph")

# ────────────────────────────────────────────────────────────
# Connection Management
# ────────────────────────────────────────────────────────────

_driver: Driver | None = None


def get_driver() -> Driver | None:
    """Return the singleton Neo4j driver, or None if unavailable."""
    global _driver
    if _driver is not None:
        return _driver
    try:
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        _driver = GraphDatabase.driver(uri, auth=(user, password))
        _driver.verify_connectivity()
        logger.info("✅ Neo4j connected at %s", uri)
        return _driver
    except Exception as exc:
        logger.warning("⚠️  Neo4j unavailable — using mock data (%s)", exc)
        _driver = None
        return None


def close_driver() -> None:
    """Gracefully close the Neo4j driver."""
    global _driver
    if _driver:
        _driver.close()
        _driver = None
        logger.info("Neo4j driver closed.")


def check_neo4j() -> bool:
    """Return True if Neo4j is reachable."""
    driver = get_driver()
    if driver is None:
        return False
    try:
        driver.verify_connectivity()
        return True
    except Exception:
        return False


# ────────────────────────────────────────────────────────────
# Mock / Demo Data (used when Neo4j is offline)
# ────────────────────────────────────────────────────────────

_MOCK_FRAUD_ACCOUNTS: list[dict[str, Any]] = [
    {"id": "UPI_8834729105", "type": "upi", "role": "mastermind", "risk_score": 0.97,
     "ring_size": 5, "total_amount": 284500.0, "is_frozen": True},
    {"id": "UPI_6621903847", "type": "upi", "role": "relay", "risk_score": 0.91,
     "ring_size": 5, "total_amount": 152300.0, "is_frozen": False},
    {"id": "UPI_3390281746", "type": "upi", "role": "relay", "risk_score": 0.88,
     "ring_size": 4, "total_amount": 97800.0, "is_frozen": False},
    {"id": "UPI_5517204839", "type": "upi", "role": "victim", "risk_score": 0.82,
     "ring_size": 4, "total_amount": 64200.0, "is_frozen": False},
    {"id": "UPI_1148302956", "type": "upi", "role": "relay", "risk_score": 0.79,
     "ring_size": 3, "total_amount": 43100.0, "is_frozen": True},
]

_MOCK_DEVICES: list[dict[str, Any]] = [
    {"id": "DEV_AA1029", "type": "device", "role": "device"},
    {"id": "DEV_BB3847", "type": "device", "role": "device"},
    {"id": "DEV_CC9201", "type": "device", "role": "device"},
]

_MOCK_MERCHANTS: list[dict[str, Any]] = [
    {"id": "MERCH_QuickMart", "type": "merchant", "role": "merchant"},
    {"id": "MERCH_PayEasy",   "type": "merchant", "role": "merchant"},
]

_MOCK_EDGES: list[dict[str, Any]] = [
    {"from": "UPI_8834729105", "to": "UPI_6621903847", "amount": 48500.0,  "isCycle": True},
    {"from": "UPI_6621903847", "to": "UPI_3390281746", "amount": 32100.0,  "isCycle": True},
    {"from": "UPI_3390281746", "to": "UPI_5517204839", "amount": 27400.0,  "isCycle": True},
    {"from": "UPI_5517204839", "to": "UPI_8834729105", "amount": 25000.0,  "isCycle": True},
    {"from": "UPI_8834729105", "to": "UPI_1148302956", "amount": 19800.0,  "isCycle": False},
    {"from": "UPI_1148302956", "to": "UPI_3390281746", "amount": 15600.0,  "isCycle": True},
    {"from": "UPI_3390281746", "to": "UPI_1148302956", "amount": 12000.0,  "isCycle": True},
    {"from": "DEV_AA1029",     "to": "UPI_8834729105", "amount": 0,        "isCycle": False},
    {"from": "DEV_BB3847",     "to": "UPI_6621903847", "amount": 0,        "isCycle": False},
    {"from": "DEV_CC9201",     "to": "UPI_3390281746", "amount": 0,        "isCycle": False},
]


def _mock_flagged() -> list[dict[str, Any]]:
    """Generate mock flagged-account list."""
    base_time = datetime.utcnow() - timedelta(hours=2)
    results: list[dict[str, Any]] = []
    for i, acct in enumerate(_MOCK_FRAUD_ACCOUNTS):
        results.append({
            "account_id": acct["id"],
            "risk_score": acct["risk_score"],
            "ring_size": acct["ring_size"],
            "total_amount": acct["total_amount"],
            "timestamp": (base_time + timedelta(minutes=i * 7)).isoformat() + "Z",
            "is_frozen": acct["is_frozen"],
        })
    return results


def _mock_report(account_id: str) -> dict[str, Any]:
    """Generate a mock SAR report for a given account."""
    acct = next((a for a in _MOCK_FRAUD_ACCOUNTS if a["id"] == account_id), None)
    if acct is None:
        return {
            "account_id": account_id,
            "ring_nodes": [],
            "edges": [],
            "sar_draft": f"No fraud data found for {account_id}.",
            "confidence": 0.0,
            "is_frozen": False,
        }
    ring_ids = [a["id"] for a in _MOCK_FRAUD_ACCOUNTS[:acct["ring_size"]]]
    ring_edges = [e for e in _MOCK_EDGES
                  if e["from"] in ring_ids and e["to"] in ring_ids]
    return {
        "account_id": account_id,
        "ring_nodes": ring_ids,
        "edges": ring_edges,
        "sar_draft": (
            f"SUSPICIOUS ACTIVITY REPORT — {account_id}\n"
            f"Role: {acct['role'].upper()} | Risk Score: {acct['risk_score']}\n"
            f"Ring Size: {acct['ring_size']} accounts | "
            f"Total Volume: ₹{acct['total_amount']:,.0f}\n\n"
            f"This account participated in a circular transfer ring involving "
            f"{', '.join(ring_ids)}. Circular fund flows detected with 24-hour "
            f"timestamp windowing indicate coordinated fraudulent activity.\n\n"
            f"RECOMMENDATION: {'Account frozen.' if acct['is_frozen'] else 'Immediate freeze recommended.'}"
        ),
        "confidence": acct["risk_score"],
        "is_frozen": acct["is_frozen"],
    }


# ────────────────────────────────────────────────────────────
# Cypher Query Functions (with mock fallbacks)
# ────────────────────────────────────────────────────────────

def detect_cycles(upi_id: str) -> list[list[str]]:
    """
    Tier 1 — DFS-based cycle detection.
    Find all circular transfer rings that include *upi_id*
    within a 24-hour timestamp window.

    Returns a list of cycles, where each cycle is a list of UPI IDs.
    """
    driver = get_driver()
    if driver is None:
        # Mock: return a simple ring if the ID is in our mock data
        if any(a["id"] == upi_id for a in _MOCK_FRAUD_ACCOUNTS):
            return [[a["id"] for a in _MOCK_FRAUD_ACCOUNTS[:4]] + [_MOCK_FRAUD_ACCOUNTS[0]["id"]]]
        return []

    query = """
    MATCH path = (start:UPI_ID {id: $upi_id})-[:TRANSFERRED_TO*2..6]->(start)
    WHERE ALL(r IN relationships(path) WHERE
        r.is_fraud = true
        AND r.timestamp >= datetime() - duration('P1D')
    )
    RETURN [n IN nodes(path) | n.id] AS cycle
    LIMIT 10
    """
    try:
        with driver.session() as session:
            result = session.run(query, upi_id=upi_id)
            cycles: list[list[str]] = [record["cycle"] for record in result]
            return cycles
    except Exception as exc:
        logger.error("detect_cycles failed: %s", exc)
        return []


def get_pagerank_hubs(min_score: float = 3.0) -> list[dict[str, Any]]:
    """
    Tier 2 — PageRank Centrality.
    Find mastermind hub accounts that receive funds from many
    compromised sources — score above *min_score*.
    """
    driver = get_driver()
    if driver is None:
        return [{"id": a["id"], "risk_score": a["risk_score"]}
                for a in _MOCK_FRAUD_ACCOUNTS if a["role"] == "mastermind"]

    query = """
    CALL gds.pageRank.stream('fraud-graph')
    YIELD nodeId, score
    WHERE score >= $min_score
    RETURN gds.util.asNode(nodeId).id AS id, score AS risk_score
    ORDER BY risk_score DESC
    LIMIT 20
    """
    try:
        with driver.session() as session:
            result = session.run(query, min_score=min_score)
            return [dict(record) for record in result]
    except Exception as exc:
        logger.warning("PageRank unavailable (GDS plugin needed): %s", exc)
        return [{"id": a["id"], "risk_score": a["risk_score"]}
                for a in _MOCK_FRAUD_ACCOUNTS if a["role"] == "mastermind"]


def get_fraud_subgraph() -> dict[str, list[dict[str, Any]]]:
    """
    Return the fraud-only subgraph for the frontend force-graph.
    Response shape: { nodes: [...], edges: [...] }
    """
    driver = get_driver()
    if driver is None:
        nodes = _MOCK_FRAUD_ACCOUNTS + _MOCK_DEVICES + _MOCK_MERCHANTS
        return {"nodes": nodes, "edges": _MOCK_EDGES}

    node_query = """
    MATCH (u:UPI_ID {is_fraud: true})
    OPTIONAL MATCH (d:Device_ID)-[:LOGGED_IN_FROM]->(u)
    OPTIONAL MATCH (u)-[:TRANSFERRED_TO]->(m:Merchant)
    WITH collect(DISTINCT {id: u.id, type: 'upi',
         role: CASE WHEN u.is_frozen THEN 'mastermind' ELSE 'relay' END}) AS upi_nodes,
         collect(DISTINCT {id: d.id, type: 'device', role: 'device'}) AS dev_nodes,
         collect(DISTINCT {id: m.id, type: 'merchant', role: 'merchant'}) AS merch_nodes
    RETURN upi_nodes + dev_nodes + merch_nodes AS nodes
    """
    edge_query = """
    MATCH (a:UPI_ID)-[r:TRANSFERRED_TO {is_fraud: true}]->(b:UPI_ID)
    RETURN a.id AS `from`, b.id AS `to`, r.amount AS amount, true AS isCycle
    UNION
    MATCH (d:Device_ID)-[:LOGGED_IN_FROM]->(u:UPI_ID {is_fraud: true})
    RETURN d.id AS `from`, u.id AS `to`, 0 AS amount, false AS isCycle
    """
    try:
        with driver.session() as session:
            nodes_result = session.run(node_query)
            nodes = nodes_result.single()["nodes"]
            # Filter out None-id nodes from optional matches
            nodes = [n for n in nodes if n.get("id") is not None]

            edges_result = session.run(edge_query)
            edges = [dict(r) for r in edges_result]
            return {"nodes": nodes, "edges": edges}
    except Exception as exc:
        logger.error("get_fraud_subgraph failed: %s", exc)
        nodes = _MOCK_FRAUD_ACCOUNTS + _MOCK_DEVICES + _MOCK_MERCHANTS
        return {"nodes": nodes, "edges": _MOCK_EDGES}


def get_account_report(account_id: str) -> dict[str, Any]:
    """
    Full transaction history + ring context for a single account.
    Used for SAR generation and the /report/{account_id} endpoint.
    """
    driver = get_driver()
    if driver is None:
        return _mock_report(account_id)

    query = """
    MATCH (u:UPI_ID {id: $account_id})
    OPTIONAL MATCH ring_path = (u)-[:TRANSFERRED_TO*1..6]->(u)
    WHERE ALL(r IN relationships(ring_path) WHERE r.is_fraud = true)
    WITH u, [n IN nodes(ring_path) | n.id] AS ring_nodes
    OPTIONAL MATCH (u)-[r:TRANSFERRED_TO]->(target)
    RETURN u.id AS account_id,
           u.is_frozen AS is_frozen,
           ring_nodes,
           collect({to: target.id, amount: r.amount, isCycle: r.is_fraud}) AS edges
    LIMIT 1
    """
    try:
        with driver.session() as session:
            result = session.run(query, account_id=account_id)
            record = result.single()
            if record is None:
                return _mock_report(account_id)
            ring = record["ring_nodes"] or []
            return {
                "account_id": record["account_id"],
                "ring_nodes": ring,
                "edges": record["edges"],
                "sar_draft": "",  # Will be filled by LangChain agent
                "confidence": 0.0,
                "is_frozen": record["is_frozen"] or False,
            }
    except Exception as exc:
        logger.error("get_account_report failed: %s", exc)
        return _mock_report(account_id)


def get_flagged_accounts() -> list[dict[str, Any]]:
    """Return all accounts with is_fraud = true."""
    driver = get_driver()
    if driver is None:
        return _mock_flagged()

    query = """
    MATCH (u:UPI_ID {is_fraud: true})
    OPTIONAL MATCH (u)-[r:TRANSFERRED_TO]->(other)
    WITH u, count(r) AS ring_size, sum(r.amount) AS total_amount
    RETURN u.id AS account_id,
           COALESCE(u.risk_score, 0.85) AS risk_score,
           ring_size,
           total_amount,
           COALESCE(u.flagged_at, datetime()) AS timestamp,
           COALESCE(u.is_frozen, false) AS is_frozen
    ORDER BY risk_score DESC
    """
    try:
        with driver.session() as session:
            result = session.run(query)
            return [
                {
                    "account_id": r["account_id"],
                    "risk_score": float(r["risk_score"]),
                    "ring_size": int(r["ring_size"]),
                    "total_amount": float(r["total_amount"]) if r["total_amount"] else 0.0,
                    "timestamp": str(r["timestamp"]),
                    "is_frozen": bool(r["is_frozen"]),
                }
                for r in result
            ]
    except Exception as exc:
        logger.error("get_flagged_accounts failed: %s", exc)
        return _mock_flagged()


def freeze_account_in_db(account_id: str) -> bool:
    """Mark an account and its devices as frozen in Neo4j."""
    driver = get_driver()
    if driver is None:
        logger.info("Mock freeze: %s", account_id)
        for a in _MOCK_FRAUD_ACCOUNTS:
            if a["id"] == account_id:
                a["is_frozen"] = True
        return True

    query = """
    MATCH (u:UPI_ID {id: $account_id})
    SET u.is_frozen = true
    WITH u
    OPTIONAL MATCH (d:Device_ID)-[:LOGGED_IN_FROM]->(u)
    SET d.is_frozen = true
    RETURN u.id AS frozen_id
    """
    try:
        with driver.session() as session:
            result = session.run(query, account_id=account_id)
            return result.single() is not None
    except Exception as exc:
        logger.error("freeze_account failed: %s", exc)
        return False


def store_transaction(upi_id: str, amount: float,
                      device_id: str, merchant: str,
                      is_fraud: bool, confidence: float) -> bool:
    """Persist a new transaction into the graph."""
    driver = get_driver()
    if driver is None:
        logger.info("Mock store: %s → %s (₹%.0f, fraud=%s)",
                     upi_id, merchant, amount, is_fraud)
        return True

    query = """
    MERGE (u:UPI_ID {id: $upi_id})
    ON CREATE SET u.is_fraud = $is_fraud
    MERGE (d:Device_ID {id: $device_id})
    MERGE (m:Merchant {id: $merchant})
    MERGE (d)-[:LOGGED_IN_FROM]->(u)
    CREATE (u)-[:TRANSFERRED_TO {
        amount: $amount,
        is_fraud: $is_fraud,
        confidence: $confidence,
        timestamp: datetime()
    }]->(m)
    RETURN u.id AS stored_id
    """
    try:
        with driver.session() as session:
            session.run(query, upi_id=upi_id, amount=amount,
                        device_id=device_id, merchant=merchant,
                        is_fraud=is_fraud, confidence=confidence)
            return True
    except Exception as exc:
        logger.error("store_transaction failed: %s", exc)
        return False
