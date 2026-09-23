"""
High-Performance Graph Store and Local Data Index
Loads IEEE-CIS transactions, identities, and closed cases into an optimized SQLite
database with indexed schemas, enabling sub-millisecond graph traversals.
"""

import os
import sqlite3
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")

def get_db_path() -> str:
    local_path = os.path.join(DATASET_DIR, "fraud_graph.db")
    if os.path.exists(local_path):
        return local_path
    try:
        os.makedirs(DATASET_DIR, exist_ok=True)
        test_file = os.path.join(DATASET_DIR, ".write_test")
        with open(test_file, "w") as f:
            f.write("1")
        os.remove(test_file)
        return local_path
    except Exception:
        tmp_dir = "/tmp" if os.path.exists("/tmp") else os.environ.get("TEMP", os.environ.get("TMP", "."))
        return os.path.join(tmp_dir, "fraud_graph.db")

DB_PATH = get_db_path()

def init_db(force_rebuild: bool = False):
    """Initializes and populates SQLite graph store if not already present."""
    db_path = get_db_path()
    try:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    except Exception:
        pass

    if os.path.exists(db_path) and not force_rebuild:
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM transactions")
            count = cur.fetchone()[0]
            conn.close()
            if count > 0:
                return
        except Exception:
            pass

    print(f"Building fast local Graph Index at {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Drop existing tables
    cur.execute("DROP TABLE IF EXISTS transactions;")
    cur.execute("DROP TABLE IF EXISTS identities;")
    cur.execute("DROP TABLE IF EXISTS closed_cases;")
    cur.execute("DROP TABLE IF EXISTS case_pack;")
    cur.execute("DROP TABLE IF EXISTS graph_memory;")

    # 1. Closed Cases
    closed_cases_path = os.path.join(DATASET_DIR, "closed_cases_history.csv")
    known_txn_to_card = {}
    known_card1_to_card_id = {}

    if os.path.exists(closed_cases_path):
        print("Loading closed cases history...")
        df_cc = pd.read_csv(closed_cases_path)
        df_cc.to_sql("closed_cases", conn, if_exists="replace", index=False)
        for _, row in df_cc.iterrows():
            cid = str(row["card_id"])
            cust = str(row["customer_id"])
            if pd.notna(row["txn_ids"]):
                for tid_s in str(row["txn_ids"]).split("|"):
                    try:
                        known_txn_to_card[int(tid_s.strip())] = cid
                    except Exception:
                        pass

    # 2. Case Pack
    case_pack_path = os.path.join(DATASET_DIR, "case_pack.csv")
    if os.path.exists(case_pack_path):
        print("Loading benchmark case pack...")
        df_cp = pd.read_csv(case_pack_path)
        df_cp.to_sql("case_pack", conn, if_exists="replace", index=False)
        for _, row in df_cp.iterrows():
            cid = str(row["card_id"])
            tid = int(row["flagged_txn_id"])
            known_txn_to_card[tid] = cid

    # 3. Identities
    identity_path = os.path.join(DATASET_DIR, "identity.csv")
    if os.path.exists(identity_path):
        print("Loading identity profiles...")
        df_id = pd.read_csv(identity_path, usecols=[
            "TransactionID", "id_15", "id_23", "id_30", "id_31", "id_33", "id_34", "DeviceType", "DeviceInfo"
        ])
        df_id["device_profile"] = (
            df_id["DeviceInfo"].fillna("Unknown").astype(str) + " | " +
            df_id["id_30"].fillna("Unknown").astype(str) + " | " +
            df_id["id_31"].fillna("Unknown").astype(str) + " | " +
            df_id["id_33"].fillna("Unknown").astype(str)
        )
        df_id.to_sql("identities", conn, if_exists="replace", index=False)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_id_tid ON identities(TransactionID);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_id_profile ON identities(device_profile);")

    # 4. Transactions
    txn_path = os.path.join(DATASET_DIR, "transactions.csv")
    if os.path.exists(txn_path):
        print("Loading transactions into fast indexed database...")
        cols = [
            "TransactionID", "ts", "TransactionAmt", "ProductCD", "card1", "card2",
            "card4", "card6", "addr1", "addr2", "P_emaildomain", "R_emaildomain",
            "customer_id", "channel", "risk_score"
        ]

        # First pass to learn customer card1 -> card_id mapping
        print("Learning customer card mappings...")
        # Populate known card1 to card_id from known transactions
        cur.execute("""
        CREATE TABLE transactions (
            TransactionID INTEGER PRIMARY KEY,
            ts TEXT,
            TransactionAmt REAL,
            ProductCD TEXT,
            card1 INTEGER,
            card2 REAL,
            card4 TEXT,
            card6 TEXT,
            addr1 REAL,
            addr2 REAL,
            P_emaildomain TEXT,
            R_emaildomain TEXT,
            customer_id TEXT,
            card_id TEXT,
            channel TEXT,
            risk_score REAL
        )
        """)

        chunk_iter = pd.read_csv(txn_path, usecols=cols, chunksize=120000)
        
        # We assign card_id deterministically: {customer_id}-K1, {customer_id}-K2 etc
        cust_cards = {} # customer_id -> {card1: card_id}
        
        # Pre-seed with known case pack & closed case associations if possible
        for i, chunk in enumerate(chunk_iter):
            card_ids = []
            for tid, cust, c1 in zip(chunk["TransactionID"], chunk["customer_id"], chunk["card1"]):
                if tid in known_txn_to_card:
                    c_id = known_txn_to_card[tid]
                    if cust not in cust_cards:
                        cust_cards[cust] = {}
                    cust_cards[cust][c1] = c_id
                    card_ids.append(c_id)
                else:
                    if cust not in cust_cards:
                        cust_cards[cust] = {}
                    if c1 not in cust_cards[cust]:
                        k_num = len(cust_cards[cust]) + 1
                        cust_cards[cust][c1] = f"{cust}-K{k_num}"
                    card_ids.append(cust_cards[cust][c1])
            
            chunk["card_id"] = card_ids
            chunk.to_sql("transactions", conn, if_exists="append", index=False)
            print(f"  Processed batch {i+1} ({len(chunk)} rows)...")

    # 5. Graph Memory Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS graph_memory (
        case_id TEXT PRIMARY KEY,
        status TEXT,
        verdict TEXT,
        fraud_probability REAL,
        pattern TEXT,
        pattern_description TEXT,
        affected_txn_ids TEXT,
        exposure_usd REAL,
        stop_reason TEXT,
        summary TEXT,
        created_at TEXT
    )
    """)

    # Build High-Speed Indexes
    print("Building high-speed indexes on graph edges...")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_id ON transactions(TransactionID);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_cust ON transactions(customer_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_card_id ON transactions(card_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_card1 ON transactions(card1);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_ts ON transactions(ts);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_txn_addr ON transactions(addr1);")

    conn.commit()
    conn.close()
    print("Graph store initialization successfully completed!")

def get_connection():
    """Returns a SQLite connection to the graph database."""
    init_db()
    return sqlite3.connect(get_db_path())

if __name__ == "__main__":
    init_db(force_rebuild=True)
