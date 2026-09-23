"""
FastAPI Server for TigerGraph Agentic Fraud Investigation System
Exposes REST endpoints for the Analyst Dashboard UI, Graph Visualizer, and Investigation Engine.
Mounts the built production frontend for seamless single-port operation.
"""

import os
import json
import sqlite3
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.agent_engine import agent_engine
from backend.graph_engine import graph_engine
from backend.tigergraph_client import tigergraph_client
from backend.data_store import get_connection, DATASET_DIR

app = FastAPI(
    title="TigerGraph Agentic Fraud Investigation API",
    description="Backend API powering the HHGOA Fraud Investigation Dashboard",
    version="1.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CASES_DIR = os.path.join(os.path.dirname(__file__), "..", "cases")
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

class InvestigateRequest(BaseModel):
    case_id: str
    trigger_type: Optional[str] = "risk_score"
    trigger_text: Optional[str] = ""
    flagged_txn_id: int
    card_id: str
    customer_id: str
    risk_score: Optional[float] = None

class TGConfig(BaseModel):
    host: str
    graphname: str = "FraudGraph"
    username: str = "tigergraph"
    password: str = "tigergraph"
    secret: Optional[str] = ""
    token: Optional[str] = ""

@app.get("/api/status")
def get_system_status():
    """Returns engine health and TigerGraph connection status."""
    conn_info = tigergraph_client.test_connection()
    return {
        "status": "online",
        "engine_mode": "Hybrid (Live Savanna + In-Memory Fallback)",
        "tigergraph": conn_info,
        "total_benchmark_cases": 20,
        "dataset_loaded": True
    }

@app.post("/api/tigergraph/config")
def update_tigergraph_config(config: TGConfig):
    """Updates and tests live TigerGraph connection parameters."""
    tigergraph_client.host = config.host
    tigergraph_client.graphname = config.graphname
    tigergraph_client.username = config.username
    tigergraph_client.password = config.password
    tigergraph_client.secret = config.secret or ""
    tigergraph_client.token = config.token or ""
    tigergraph_client.is_configured = bool(config.host and "your-subdomain" not in config.host)
    
    test_result = tigergraph_client.test_connection()
    return test_result

@app.get("/api/cases")
def list_cases():
    """Returns the 20 benchmark cases with summary status."""
    case_pack_path = os.path.join(DATASET_DIR, "case_pack.csv")
    if not os.path.exists(case_pack_path):
        raise HTTPException(status_code=404, detail="case_pack.csv not found")

    df_pack = pd.read_csv(case_pack_path)
    cases_list = []

    for _, row in df_pack.iterrows():
        cid = row["case_id"]
        solved_path = os.path.join(CASES_DIR, f"{cid}.json")
        result_data = None
        if os.path.exists(solved_path):
            try:
                with open(solved_path, "r", encoding="utf-8") as f:
                    result_data = json.load(f)
            except Exception:
                pass

        cases_list.append({
            "case_id": cid,
            "opened_at": row["opened_at"],
            "trigger_type": row["trigger_type"],
            "trigger_text": row["trigger_text"],
            "flagged_txn_id": int(row["flagged_txn_id"]),
            "card_id": row["card_id"],
            "customer_id": row["customer_id"],
            "risk_score": float(row["risk_score"]) if pd.notna(row["risk_score"]) else None,
            "status": result_data["case"]["status"] if result_data else "pending",
            "verdict": result_data["case"]["verdict"] if result_data else "unexamined",
            "fraud_probability": result_data["case"]["fraud_probability"] if result_data else None,
            "pattern": result_data["case"]["pattern"] if result_data else "none",
            "exposure_usd": result_data["case"]["exposure_usd"] if result_data else 0.0,
            "sar_file": result_data["sar"]["file"] if result_data else False
        })

    return cases_list

@app.get("/api/cases/{case_id}")
def get_case_detail(case_id: str):
    """Retrieves full case document by case_id."""
    solved_path = os.path.join(CASES_DIR, f"{case_id}.json")
    if os.path.exists(solved_path):
        with open(solved_path, "r", encoding="utf-8") as f:
            return json.load(f)

    case_pack_path = os.path.join(DATASET_DIR, "case_pack.csv")
    df_pack = pd.read_csv(case_pack_path)
    matched = df_pack[df_pack["case_id"] == case_id]
    if matched.empty:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    case_input = matched.iloc[0].to_dict()
    result = agent_engine.investigate(case_input)
    return result

@app.post("/api/investigate")
def run_investigation(req: InvestigateRequest):
    """Executes the agentic investigation pipeline dynamically."""
    result = agent_engine.investigate(req.dict())
    return result

@app.get("/api/graph/{case_id}")
def get_graph_subgraph(case_id: str):
    """Returns nodes and edges for interactive Force Graph visualization."""
    case_pack_path = os.path.join(DATASET_DIR, "case_pack.csv")
    df_pack = pd.read_csv(case_pack_path)
    matched = df_pack[df_pack["case_id"] == case_id]

    if matched.empty:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    row = matched.iloc[0]
    flagged_txn_id = int(row["flagged_txn_id"])
    card_id = row["card_id"]
    customer_id = row["customer_id"]

    solved_path = os.path.join(CASES_DIR, f"{case_id}.json")
    connected_cards = []
    if os.path.exists(solved_path):
        try:
            with open(solved_path, "r", encoding="utf-8") as f:
                cdata = json.load(f)
                connected_cards = cdata.get("case", {}).get("connected_card_ids", [])
        except Exception:
            pass

    subgraph = graph_engine.get_subgraph_for_visualization(
        case_id=case_id,
        flagged_txn_id=flagged_txn_id,
        card_id=card_id,
        customer_id=customer_id,
        connected_cards=connected_cards
    )
    return subgraph

@app.get("/api/memory")
def get_graph_memory():
    """Retrieves all persisted cases in graph memory."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT case_id, status, verdict, fraud_probability, pattern, exposure_usd, summary, created_at
        FROM graph_memory
        ORDER BY created_at DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "case_id": r[0],
            "status": r[1],
            "verdict": r[2],
            "fraud_probability": r[3],
            "pattern": r[4],
            "exposure_usd": r[5],
            "summary": r[6],
            "created_at": r[7]
        }
        for r in rows
    ]

# Serve production frontend if built
if os.path.exists(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=True)
