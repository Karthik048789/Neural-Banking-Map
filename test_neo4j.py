import os
from neo4j import GraphDatabase

uri = "bolt://localhost:7687"

for pw in ["neo4j", "password", "test", "admin"]:
    try:
        driver = GraphDatabase.driver(uri, auth=("neo4j", pw))
        driver.verify_connectivity()
        print(f"SUCCESS with password: {pw}")
        driver.close()
        break
    except Exception as e:
        print(f"FAILED with password: {pw} - {e}")
