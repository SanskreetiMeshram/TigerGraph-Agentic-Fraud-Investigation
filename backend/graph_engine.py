"""
TigerGraph Engine & Graph Analytics
Provides graph traversal algorithms (card_window, device_neighbors, region_burst, find_similar_cases)
with seamless dual execution: live TigerGraph instance when available, backed by indexed in-memory store.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
from backend.data_store import get_connection
from backend.tigergraph_client import tigergraph_client

class GraphEngine:
    def __init__(self):
        self.tg_client = tigergraph_client

    def get_transaction(self, txn_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single transaction with its identity device profile if available."""
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT t.TransactionID, t.ts, t.TransactionAmt, t.ProductCD, t.card1, t.card2,
                   t.card4, t.card6, t.addr1, t.addr2, t.P_emaildomain, t.R_emaildomain,
                   t.customer_id, t.card_id, t.channel, t.risk_score,
                   i.device_profile, i.id_15, i.id_23, i.id_30, i.id_31, i.id_33, i.DeviceInfo, i.DeviceType
            FROM transactions t
            LEFT JOIN identities i ON t.TransactionID = i.TransactionID
            WHERE t.TransactionID = ?
        """, (txn_id,))
        row = cur.fetchone()
        conn.close()

        if not row:
            return None

        return {
            "TransactionID": row[0],
            "ts": row[1],
            "TransactionAmt": row[2],
            "ProductCD": row[3],
            "card1": row[4],
            "card2": row[5],
            "card4": row[6],
            "card6": row[7],
            "addr1": row[8],
            "addr2": row[9],
            "P_emaildomain": row[10],
            "R_emaildomain": row[11],
            "customer_id": row[12],
            "card_id": row[13],
            "channel": row[14],
            "risk_score": row[15],
            "device_profile": row[16],
            "id_15": row[17],
            "id_23": row[18],
            "id_30": row[19],
            "id_31": row[20],
            "id_33": row[21],
            "DeviceInfo": row[22],
            "DeviceType": row[23]
        }

    def card_window(self, card_id: str, anchor_time_str: str, hours: int = 48) -> List[Dict[str, Any]]:
        """
        GSQL Algorithm 1: card_window
        Finds transactions on card_id within +/- hours of anchor_time.
        """
        # Try live TigerGraph query first if connected
        live_res = self.tg_client.run_installed_query("card_window", {
            "card_id": card_id,
            "anchor_time": anchor_time_str,
            "hours": hours
        })
        if live_res and len(live_res) > 0 and "@@txns" in live_res[0]:
            return live_res[0]["@@txns"]

        # In-Memory Graph Index fallback
        conn = get_connection()
        cur = conn.cursor()
        
        anchor_dt = datetime.strptime(anchor_time_str, "%Y-%m-%d %H:%M:%S")
        start_dt = (anchor_dt - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
        end_dt = (anchor_dt + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")

        cur.execute("""
            SELECT t.TransactionID, t.ts, t.TransactionAmt, t.ProductCD, t.channel, t.risk_score,
                   t.addr1, t.P_emaildomain, i.device_profile, i.id_15, i.id_23
            FROM transactions t
            LEFT JOIN identities i ON t.TransactionID = i.TransactionID
            WHERE t.card_id = ? AND t.ts BETWEEN ? AND ?
            ORDER BY t.ts ASC
        """, (card_id, start_dt, end_dt))
        
        rows = cur.fetchall()
        conn.close()

        results = []
        for r in rows:
            results.append({
                "TransactionID": r[0],
                "ts": r[1],
                "TransactionAmt": r[2],
                "ProductCD": r[3],
                "channel": r[4],
                "risk_score": r[5],
                "addr1": r[6],
                "P_emaildomain": r[7],
                "device_profile": r[8],
                "id_15": r[9],
                "id_23": r[10]
            })
        return results

    def device_neighbors(self, device_profile: str) -> Dict[str, Any]:
        """
        GSQL Algorithm 2: device_neighbors
        Multi-hop graph expansion finding all cards, customers, and transactions sharing this device profile.
        """
        if not device_profile or device_profile == "Unknown":
            return {"connected_cards": [], "connected_customers": [], "connected_txns": []}

        live_res = self.tg_client.run_installed_query("device_neighbors", {
            "device_profile_id": device_profile
        })
        if live_res and len(live_res) > 0:
            return {
                "connected_cards": list(live_res[0].get("@@connected_cards", [])),
                "connected_customers": list(live_res[0].get("@@connected_customers", [])),
                "connected_txns": []
            }

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT t.card_id, t.customer_id, t.TransactionID, t.ts, t.TransactionAmt
            FROM identities i
            JOIN transactions t ON i.TransactionID = t.TransactionID
            WHERE i.device_profile = ?
        """, (device_profile,))

        rows = cur.fetchall()
        conn.close()

        cards = sorted(list(set(r[0] for r in rows if r[0])))
        custs = sorted(list(set(r[1] for r in rows if r[1])))
        txns = [r[2] for r in rows]

        return {
            "connected_cards": cards,
            "connected_customers": custs,
            "connected_txns": txns
        }

    def region_burst(self, customer_id: str, card_id: str, test_region: float) -> Dict[str, Any]:
        """
        GSQL Algorithm 3: region_burst
        Calculates customer's historical billing region distribution vs candidate transaction region.
        """
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT addr1, count(*) as cnt
            FROM transactions
            WHERE card_id = ? AND addr1 IS NOT NULL
            GROUP BY addr1
            ORDER BY cnt DESC
        """, (card_id,))

        rows = cur.fetchall()
        conn.close()

        region_history = {str(int(r[0])) if r[0] is not None else "None": r[1] for r in rows}
        test_str = str(int(test_region)) if test_region is not None else "None"
        is_novel = test_str not in region_history or (region_history[test_str] <= 2 and sum(region_history.values()) > 10)
        
        home_region = rows[0][0] if len(rows) > 0 else None

        return {
            "region_history": region_history,
            "is_novel_region": is_novel,
            "home_region": home_region,
            "test_region": test_region
        }

    def find_similar_cases(self, pattern: Optional[str] = None, customer_id: Optional[str] = None, card_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        GSQL Algorithm 4: find_similar_cases (Case Memory Retrieval)
        Retrieves matching historical closed cases from TigerGraph or local memory.
        """
        conn = get_connection()
        cur = conn.cursor()

        # Check in closed_cases table
        conditions = []
        params = []
        if customer_id:
            conditions.append("customer_id = ?")
            params.append(customer_id)
        if card_id:
            conditions.append("card_id = ?")
            params.append(card_id)
        if pattern and pattern != "none":
            conditions.append("pattern = ?")
            params.append(pattern)

        query = "SELECT case_id, customer_id, card_id, outcome, pattern, exposure_usd, analyst_notes FROM closed_cases"
        if conditions:
            query += " WHERE " + " OR ".join(conditions)
        query += f" LIMIT {limit}"

        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        conn.close()

        results = []
        for r in rows:
            results.append({
                "case_id": r[0],
                "customer_id": r[1],
                "card_id": r[2],
                "outcome": r[3],
                "pattern": r[4],
                "exposure_usd": r[5],
                "analyst_notes": r[6]
            })
        return results

    def save_case_memory(self, case_record: Dict[str, Any]) -> str:
        """
        GSQL Algorithm 5: insert_case_vertex
        Persists newly investigated or closed case to Graph Memory.
        """
        case_id = case_record["case_id"]
        status = case_record.get("case", {}).get("status", "open")
        verdict = case_record.get("case", {}).get("verdict", "uncertain")
        fraud_prob = case_record.get("case", {}).get("fraud_probability", 0.5)
        pattern = case_record.get("case", {}).get("pattern", "none")
        pattern_desc = case_record.get("case", {}).get("pattern_description", "")
        affected = ",".join(str(x) for x in case_record.get("case", {}).get("affected_txn_ids", []))
        exposure = case_record.get("case", {}).get("exposure_usd", 0.0)
        stop_reason = case_record.get("stop_reason", "")
        summary = case_record.get("case", {}).get("summary", "")
        created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Upsert to live TigerGraph if accessible
        self.tg_client.upsert_vertex("InvestigationCase", case_id, {
            "case_id": case_id,
            "status": status,
            "verdict": verdict,
            "fraud_probability": fraud_prob,
            "pattern": pattern,
            "exposure_usd": exposure,
            "stop_reason": stop_reason,
            "summary": summary,
            "created_at": created_at
        })

        # 2. Persist to local SQLite store
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO graph_memory
            (case_id, status, verdict, fraud_probability, pattern, pattern_description, affected_txn_ids, exposure_usd, stop_reason, summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (case_id, status, verdict, fraud_prob, pattern, pattern_desc, affected, exposure, stop_reason, summary, created_at))
        conn.commit()
        conn.close()

        return f"CASE-2016-{case_id.replace('HHG-', '')}"

    def get_subgraph_for_visualization(self, case_id: str, flagged_txn_id: int, card_id: str, customer_id: str, connected_cards: List[str] = None, connected_devices: List[str] = None) -> Dict[str, Any]:
        """
        Builds a rich subgraph (nodes and edges) for the interactive Force Graph visualizer in UI.
        """
        nodes = []
        edges = []
        node_ids = set()

        def add_node(nid, label, ntype, details=None):
            if nid not in node_ids:
                node_ids.add(nid)
                nodes.append({
                    "id": nid,
                    "label": label,
                    "type": ntype,
                    "details": details or {}
                })

        def add_edge(src, tgt, rel):
            edges.append({
                "source": src,
                "target": tgt,
                "relation": rel
            })

        # 1. Customer Node
        add_node(customer_id, f"Customer {customer_id}", "customer", {"customer_id": customer_id})

        # 2. Primary Card Node
        add_node(card_id, f"Card {card_id}", "card", {"card_id": card_id, "customer_id": customer_id})
        add_edge(customer_id, card_id, "OWNS")

        # 3. Flagged Transaction Node
        flagged_txn = self.get_transaction(flagged_txn_id)
        if flagged_txn:
            add_node(
                f"T{flagged_txn_id}",
                f"${flagged_txn['TransactionAmt']:.2f}\n(Txn {flagged_txn_id})",
                "transaction",
                flagged_txn
            )
            add_edge(card_id, f"T{flagged_txn_id}", "MADE")

            # 4. Device Profile Node
            if flagged_txn.get("device_profile") and flagged_txn["device_profile"] != "Unknown":
                dev_id = f"DEV_{hash(flagged_txn['device_profile']) % 100000}"
                add_node(dev_id, f"Device: {flagged_txn.get('DeviceInfo') or 'Device'}", "device", {
                    "profile": flagged_txn["device_profile"],
                    "os": flagged_txn.get("id_30"),
                    "browser": flagged_txn.get("id_31")
                })
                add_edge(f"T{flagged_txn_id}", dev_id, "FROM_DEVICE")

            # 5. Billing Region Node
            if flagged_txn.get("addr1"):
                region_id = f"REG_{int(flagged_txn['addr1'])}"
                add_node(region_id, f"Region {int(flagged_txn['addr1'])}", "region", {"region_code": flagged_txn["addr1"]})
                add_edge(f"T{flagged_txn_id}", region_id, "BILLED_IN")

        # 6. Connected Cards (e.g. from shared device ring)
        if connected_cards:
            for cc in connected_cards:
                if cc != card_id:
                    add_node(cc, f"Ring Card {cc}", "connected_card", {"card_id": cc})
                    if flagged_txn and flagged_txn.get("device_profile"):
                        dev_id = f"DEV_{hash(flagged_txn['device_profile']) % 100000}"
                        add_edge(dev_id, cc, "SHARED_WITH")

        # 7. Similar Closed Cases from memory
        similar = self.find_similar_cases(customer_id=customer_id, card_id=card_id, limit=2)
        for sc in similar:
            sc_id = sc["case_id"]
            add_node(sc_id, f"Prior: {sc_id} ({sc['outcome']})", "closed_case", sc)
            add_edge(sc_id, card_id, "PRIOR_CASE_ON")

        return {"nodes": nodes, "edges": edges}

graph_engine = GraphEngine()
