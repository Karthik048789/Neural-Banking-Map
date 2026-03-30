"""Clear all data from Neo4j so we start fresh with the fixed inference."""
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

try:
    driver.verify_connectivity()
except Exception:
    # Try alternate password
    driver.close()
    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "pass"))

with driver.session() as session:
    result = session.run("MATCH (n) RETURN count(n) AS cnt")
    count = result.single()["cnt"]
    print(f"Found {count} nodes in Neo4j. Clearing...")

    session.run("MATCH (n) DETACH DELETE n")
    print("✅ Neo4j cleared. Ready for fresh simulation data.")

driver.close()
