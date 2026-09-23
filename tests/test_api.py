"""
API Verification Suite
Tests FastAPI endpoints for case listing, case retrieval, graph visualization, and memory.
"""

from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_api_suite():
    # 1. Status
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    print("[PASS] GET /api/status passed")

    # 2. List cases
    res = client.get("/api/cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) == 20
    print(f"[PASS] GET /api/cases passed ({len(cases)} benchmark cases)")

    # 3. Get single case
    res = client.get("/api/cases/HHG-001")
    assert res.status_code == 200
    case_1 = res.json()
    assert case_1["case_id"] == "HHG-001"
    print("[PASS] GET /api/cases/HHG-001 passed")

    # 4. Get graph visualization
    res = client.get("/api/graph/HHG-014")
    assert res.status_code == 200
    graph = res.json()
    assert "nodes" in graph and "edges" in graph
    assert len(graph["nodes"]) > 0
    print(f"[PASS] GET /api/graph/HHG-014 passed ({len(graph['nodes'])} nodes, {len(graph['edges'])} edges)")

    # 5. Get memory
    res = client.get("/api/memory")
    assert res.status_code == 200
    memory = res.json()
    assert len(memory) > 0
    print(f"[PASS] GET /api/memory passed ({len(memory)} persisted cases)")

    print("\nAll Backend API Verification Tests PASSED!")

if __name__ == "__main__":
    test_api_suite()
