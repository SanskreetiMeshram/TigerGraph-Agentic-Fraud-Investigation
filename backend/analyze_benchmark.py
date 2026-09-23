"""
Deep Analysis of the 20 Benchmark Cases
Extracts graph topology, device links, velocity patterns, and prior cases for each case.
"""

import sqlite3
import json

def analyze_all():
    conn = sqlite3.connect("dataset/fraud_graph.db")
    cur = conn.cursor()

    cur.execute("SELECT case_id, trigger_type, flagged_txn_id, card_id, customer_id, risk_score, trigger_text FROM case_pack ORDER BY case_id")
    cases = cur.fetchall()

    for c in cases:
        cid, ttype, tid, card, cust, rscore, ttext = c
        cur.execute("""
            SELECT t.TransactionAmt, t.ProductCD, t.channel, t.addr1, t.ts, i.device_profile, i.id_15, i.id_23
            FROM transactions t
            LEFT JOIN identities i ON t.TransactionID = i.TransactionID
            WHERE t.TransactionID = ?
        """, (tid,))
        txn = cur.fetchone()

        cur.execute("SELECT case_id, outcome, pattern, analyst_notes FROM closed_cases WHERE customer_id = ?", (cust,))
        priors = cur.fetchall()

        dev_cards = []
        if txn and txn[5] and txn[5] != "Unknown":
            cur.execute("""
                SELECT DISTINCT t.card_id
                FROM identities i
                JOIN transactions t ON i.TransactionID = t.TransactionID
                WHERE i.device_profile = ?
            """, (txn[5],))
            dev_cards = [r[0] for r in cur.fetchall() if r[0] != card]

        # Check card window transactions
        cur.execute("""
            SELECT TransactionID, ts, TransactionAmt, ProductCD, channel, risk_score, addr1
            FROM transactions
            WHERE card_id = ?
            ORDER BY ts ASC
        """, (card,))
        all_card_txns = cur.fetchall()

        print(f"==================================================")
        print(f"CASE {cid} | Trigger: {ttype} | Score: {rscore}")
        print(f"  Customer: {cust} | Card: {card} | Flagged Txn: {tid}")
        if txn:
            print(f"  Amt: ${txn[0]} | Channel: {txn[2]} | Region: {txn[3]} | Time: {txn[4]}")
            print(f"  Device: {txn[5]}")
            print(f"  Device Status: {txn[6]} | Proxy: {txn[7]}")
        print(f"  Total txns on card: {len(all_card_txns)}")
        if dev_cards:
            print(f"  LINKED CARDS (shared device): {dev_cards[:5]}")
        if priors:
            print(f"  PRIOR CASES on customer: {[(p[0], p[1], p[2]) for p in priors]}")

    conn.close()

if __name__ == "__main__":
    analyze_all()
