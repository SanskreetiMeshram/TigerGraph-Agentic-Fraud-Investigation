"""
Benchmark Runner & Validation Suite
Executes the Agentic Investigation across all 20 Benchmark Cases (HHG-001 through HHG-020),
writes the official submission JSON files into cases/, and validates strict compliance.
"""

import os
import json
import sqlite3
import pandas as pd
from typing import Dict, Any, List
from backend.agent_engine import agent_engine

CASES_DIR = os.path.join(os.path.dirname(__file__), "..", "cases")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "case_pack.csv")

VALID_PATTERNS = {
    "card_testing", "card_not_present_fraud", "card_not_present_new_device",
    "out_of_region_use", "account_takeover", "undocumented", "none"
}

VALID_ACTIONS = {
    "ALLOW_TRANSACTION", "DECLINE_TRANSACTION", "MONITOR_CARD", "MONITOR_CONNECTED_CARDS",
    "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER", "STEP_UP_AUTH", "BLOCK_CARD", "BLOCK_ALL_CARDS",
    "GENERATE_REPORT", "CREATE_CASE", "FILE_REPORT", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
}

VALID_ROUTES = {"auto", "L1", "L2"}

def validate_case_json(data: Dict[str, Any]) -> List[str]:
    """Validates a case JSON file against hackathon schema specifications."""
    errors = []
    
    # Top level checks
    top_fields = ["case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls", "tokens", "latency_s"]
    for f in top_fields:
        if f not in data:
            errors.append(f"Missing top-level field: {f}")

    # Case checks
    c = data.get("case", {})
    case_fields = [
        "status", "verdict", "fraud_probability", "pattern", "pattern_description",
        "affected_txn_ids", "first_suspicious_txn_id", "connected_card_ids",
        "connected_device_profiles", "exposure_usd", "evidence", "similar_prior_cases",
        "summary", "written_to_graph", "graph_case_id"
    ]
    for cf in case_fields:
        if cf not in c:
            errors.append(f"Missing case field: {cf}")

    if c.get("pattern") not in VALID_PATTERNS:
        errors.append(f"Invalid pattern: {c.get('pattern')}")

    if c.get("pattern") == "undocumented" and not c.get("pattern_description"):
        errors.append("Pattern is undocumented but pattern_description is empty")

    if c.get("verdict") == "legitimate":
        if len(c.get("affected_txn_ids", [])) > 0:
            errors.append("Verdict is legitimate but affected_txn_ids is not empty")
        if c.get("exposure_usd", 0) != 0:
            errors.append("Verdict is legitimate but exposure_usd is not 0")

    # NBA checks
    nba = data.get("next_best_actions", {})
    for list_name in ["initial", "final"]:
        act_list = nba.get(list_name, [])
        if not isinstance(act_list, list):
            errors.append(f"NBA {list_name} must be a list")
        else:
            for item in act_list:
                if item.get("action") not in VALID_ACTIONS:
                    errors.append(f"Invalid action in {list_name}: {item.get('action')}")
                if item.get("route") not in VALID_ROUTES:
                    errors.append(f"Invalid approval route in {list_name}: {item.get('route')}")

    # SAR checks
    sar = data.get("sar", {})
    file_sar = sar.get("file")
    has_file_report_in_final = any(a.get("action") == "FILE_REPORT" for a in nba.get("final", []))
    
    if file_sar != has_file_report_in_final:
        errors.append(f"sar.file ({file_sar}) does not agree with FILE_REPORT presence in final NBA ({has_file_report_in_final})")

    if file_sar:
        if not sar.get("narrative"):
            errors.append("sar.file is true but narrative is empty")
        if len(sar.get("subjects", [])) == 0:
            errors.append("sar.file is true but subjects list is empty")
        if sar.get("total_amount_usd", 0) <= 0:
            errors.append("sar.file is true but total_amount_usd is <= 0")
        if len(sar.get("activity_dates", [])) != 2:
            errors.append("sar.file is true but activity_dates does not contain 2 dates")
    else:
        if sar.get("narrative") != "":
            errors.append("sar.file is false but narrative is not empty")
        if len(sar.get("subjects", [])) != 0:
            errors.append("sar.file is false but subjects is not empty")
        if sar.get("total_amount_usd", 0) != 0:
            errors.append("sar.file is false but total_amount_usd is not 0")
        if len(sar.get("activity_dates", [])) != 0:
            errors.append("sar.file is false but activity_dates is not empty")

    return errors

def run_benchmark():
    os.makedirs(CASES_DIR, exist_ok=True)
    df_pack = pd.read_csv(DATASET_PATH)

    print(f"==================================================")
    print(f"RUNNING BENCHMARK EVALUATION ON {len(df_pack)} CASES")
    print(f"==================================================")

    all_passed = True
    for idx, row in df_pack.iterrows():
        case_input = row.to_dict()
        cid = case_input["case_id"]

        print(f"\nInvestigating {cid} ({case_input['trigger_type']})...")
        result = agent_engine.investigate(case_input)

        out_path = os.path.join(CASES_DIR, f"{cid}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # Validate
        errs = validate_case_json(result)
        if errs:
            all_passed = False
            print(f"  FAILED VALIDATION for {cid}:")
            for e in errs:
                print(f"    - {e}")
        else:
            verdict = result["case"]["verdict"]
            prob = result["case"]["fraud_probability"]
            pat = result["case"]["pattern"]
            exp = result["case"]["exposure_usd"]
            sar = result["sar"]["file"]
            print(f"  SUCCESS: verdict={verdict} (p={prob}), pattern={pat}, exp=${exp:.2f}, sar={sar}")

    print("\n==================================================")
    if all_passed:
        print("ALL 20 BENCHMARK CASES PASSED VALIDATION WITH 100% COMPLIANCE!")
    else:
        print("Some benchmark cases had validation warnings.")
    print(f"Output files saved in: {CASES_DIR}")
    print("==================================================")

if __name__ == "__main__":
    run_benchmark()
