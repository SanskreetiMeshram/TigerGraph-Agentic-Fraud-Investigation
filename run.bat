@echo off
echo ======================================================================
echo CaseGuard: TigerGraph Agentic Fraud Investigation & Next-Best Action
echo ======================================================================
echo Starting FastAPI server and Analyst Dashboard on http://localhost:8000 ...

if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
)
pause
