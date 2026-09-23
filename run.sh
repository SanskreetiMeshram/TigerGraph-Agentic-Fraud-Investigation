#!/usr/bin/env bash
echo "======================================================================"
echo "CaseGuard: TigerGraph Agentic Fraud Investigation & Next-Best Action"
echo "======================================================================"
echo "Starting FastAPI server and Analyst Dashboard on http://localhost:8000 ..."

if [ -f ".venv/bin/python" ]; then
    .venv/bin/python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
else
    python3 -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
fi
