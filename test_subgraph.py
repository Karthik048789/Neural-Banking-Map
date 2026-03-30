import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), "fraud-detector", "backend")
sys.path.append(backend_path)

from graph.queries import get_driver, get_fraud_subgraph, store_transaction

driver = get_driver()
if driver is None:
    print("WARNING: check_neo4j failed. Driver is None.")
else:
    print("Driver connected.")
    
try:
    print("Testing store_transaction...")
    store_transaction(
        upi_id="TEST_UPI",
        amount=100.0,
        device_id="TEST_DEV",
        merchant="TEST_MERCH",
        is_fraud=True,
        confidence=0.9
    )
    print("store_transaction OK.")
except Exception as e:
    print(f"store_transaction error: {e}")

try:
    print("Testing get_fraud_subgraph...")
    graph = get_fraud_subgraph()
    nodes = graph.get("nodes", [])
    if len(nodes) > 0 and nodes[0].get("id") == "UPI_8834729105":
        print("Got MOCK data fallback. An exception must have occurred inside get_fraud_subgraph!")
    else:
        print(f"Graph query success! Nodes size: {len(nodes)}")
except Exception as e:
    print(f"get_fraud_subgraph error: {e}")
