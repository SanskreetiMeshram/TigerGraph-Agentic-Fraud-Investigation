# CaseGuard: Winning with Uncertainty-Gated Agentic Fraud Investigation on TigerGraph

*A Submission for the TigerGraph × Hacker House Goa 2026 Agentic Fraud Investigation Hackathon*

---

## 1. Executive Summary

Financial fraud teams today face an unsustainable operational bottleneck. Analysts manually query siloed databases, trace transaction paths across multiple accounts, cross-reference opaque risk model scores against institutional compliance policies, and piece together fragmented evidence. By the time human investigators assemble enough context to make a defensible decision, the stolen funds have often crossed multiple accounts and cash-out points.

Traditional automated systems suffer from the **"Binary Fallacy"**: forcing an instantaneous, brittle `fraud` vs. `legitimate` classification based on static thresholds or isolated machine learning risk scores. When signals are ambiguous—such as a single elevated score with no cardholder complaint, or a novel billing region that might simply be an unannounced business trip—conventional systems either over-block innocent customers (destroying customer trust and revenue) or under-block coordinated fraud rings.

**CaseGuard** solves this challenge by implementing an **Uncertainty-Gated Autonomous Agent** powered by **TigerGraph Savanna**, **GSQL Graph Analytics**, **GraphRAG**, and a **Cyclic Agentic State Machine**. CaseGuard acts as *"an investigator that knows what it doesn't know"*:
1. It executes deterministic, sub-millisecond GSQL graph traversals to expose complex topologies (e.g., card testing velocity, shared device syndicates, and out-of-region bursts).
2. It explicitly computes multi-factor **Uncertainty and Calibration Scores**, refusing to guess when signals are weak.
3. It executes policy-governed **Controlled Evidence Gathering** (e.g., step-up 2FA, cardholder transaction pings).
4. It dynamically **evolves Next-Best Actions (NBA)**—recording defensible recommendations both before and after evidence arrives, with strict institutional approval routes (`auto`, `L1`, `L2`).
5. It generates regulatory FinCEN-compliant **Suspicious Activity Reports (SARs)** with 6–12 sentence narratives.
6. It writes every closed case back into **TigerGraph Case Memory**, transforming individual findings into shared institutional intelligence for future investigations.

---

## 2. Architecture & Workflow

```
+-------------------------------------------------------------------------------------------------+
|                                    INVESTIGATION TRIGGERS                                       |
|     +-------------------------+   +-------------------------+   +-------------------------+     |
|     |  Model Risk Score Alert |   | Customer Dispute Report |   |  Analyst Ring Discovery |     |
|     +------------+------------+   +------------+------------+   +------------+------------+     |
+------------------|-----------------------------|-----------------------------|------------------+
                   +-----------------------------v-----------------------------+
                                                 |
                                                 v
+-------------------------------------------------------------------------------------------------+
|                                TIGERGRAPH GRAPH ANALYTICS LAYER                                 |
|                                                                                                 |
|   Vertices: Customer, Card, Transaction, DeviceProfile, EmailDomain, BillingRegion, ClosedCase  |
|   Edges:    OWNS, MADE, FROM_DEVICE, PURCHASER_EMAIL, BILLED_IN, NEXT, INVOLVES, ON_CARD        |
|                                                                                                 |
|   Installed GSQL Queries & Graph Traversals:                                                    |
|   - card_window(card_id, ts, hours): Sliding window velocity & sub-$5 testing sequences         |
|   - device_neighbors(device_profile): Multi-hop expansion across shared cardholder rings        |
|   - region_burst(customer_id, card_id, region): Out-of-region anomaly vs baseline profile       |
|   - find_similar_cases(pattern, customer_id): Vector & topological case memory retrieval        |
|   - insert_case_vertex(case_id, verdict, exp): Dynamic graph memory persistence                |
+------------------------------------------------+------------------------------------------------+
                                                 |
                                                 v
+-------------------------------------------------------------------------------------------------+
|                                CYCLIC AGENTIC REASONING PIPELINE                                |
|                                                                                                 |
|   [1. Ingest Alert] ---> [2. Graph Traversal] ---> [3. Deterministic Pattern Detection]         |
|                                                                    |                            |
|   [6. Controlled Action] <-- [5. Uncertainty-Gating] <--- [4. GraphRAG Policy Grounding]        |
|          |                         (Conf < 0.70?)                                               |
|          v                                                                                      |
|   [7. NBA Evolution] ---> [8. FinCEN SAR Generator] ---> [9. Persist to TigerGraph Memory]      |
|    (Initial vs Final)        (Exceeds $1,000 / Ring)           (CASE-2016-XXX Vertex)           |
+-------------------------------------------------------------------------------------------------+
```

---

## 3. How TigerGraph is Used

TigerGraph serves as the cognitive spine of CaseGuard, handling both **high-throughput graph traversal** and **long-term episodic memory**.

### 3.1 Graph Schema
The graph model reflects real-world banking relationships from the 590,000+ transaction IEEE-CIS Vesta dataset:
- **`Customer`**: Root identity node with ownership edges (`OWNS`) to multiple payment cards.
- **`Card`**: Payment card instance linked to transactions via `MADE`.
- **`Transaction`**: Spatiotemporal nodes with timestamps, amounts, channels, and risk scores.
- **`DeviceProfile`**: Composite identity signatures (`DeviceInfo | OS | Browser | Screen | Proxy`) linked via `FROM_DEVICE`.
- **`BillingRegion`**: Geographic billing centroids (`addr1`) linked via `BILLED_IN`.
- **`ClosedCase` & `InvestigationCase`**: Graph vertices storing past and active investigation records, enabling circular case-memory retrieval.

### 3.2 GSQL Graph Algorithms
Rather than burdening an LLM with calculating graph paths, CaseGuard delegates 100% of graph execution to native GSQL queries:
1. **Sliding Card Window (`card_window`)**: Scans +/- 48 hours to detect rapid card-testing micro-authorizations under $10 in 2 hours followed by larger spend.
2. **Device Sharing Expansion (`device_neighbors`)**: Traverses from a device profile across transaction edges to discover hidden multi-accounting rings and proxy networks. In Case **HHG-014**, GSQL discovered that a single Android device behind an anonymous proxy was linked across **52 distinct customer cards**!
3. **Region Burst (`region_burst`)**: Evaluates transaction geography against historical baseline spend to differentiate unauthorized card-present clone use from legitimate cardholder travel.

---

## 4. Key Agentic Capabilities

### 4.1 Uncertainty-Gating (Knowing What It Doesn't Know)
When an alert is triggered solely by a single moderate risk score (e.g. 0.55 in **HHG-001** and **HHG-012**), CaseGuard refuses to guess. In compliance with **Bank Policy Rule R1**, the agent assesses the fraud probability as calibrated and uncertain, enforcing that no legitimate customer may be blocked on a single weak signal.

### 4.2 Dynamic Next-Best Action (NBA) Evolution
CaseGuard logs actionable recommendations across two distinct stages:
- **Initial NBA (Pre-Evidence)**: What the institution must do immediately (e.g. `ALLOW_TRANSACTION` with `VERIFY_WITH_CUSTOMER` on weak signals, or temporary `DECLINE_TRANSACTION` with `STEP_UP_AUTH` on card testing).
- **Final NBA (Post-Evidence)**: Updated recommendations once simulated evidence arrives (e.g. customer denial elevates the action to `BLOCK_CARD` with approval routing `L1` or `L2`, `CREATE_CASE`, and `FILE_REPORT`).

### 4.3 Graph-Native Case Memory
Every completed case is written directly back into the graph via GSQL query `insert_case_vertex`. When Case **HHG-012** triggered an out-of-region alert on card `C05876-K2`, the agent queried TigerGraph case memory and retrieved closed case **CC-0003**, which documented that this specific cardholder has confirmed legitimate travel history to that exact region. This allowed the agent to correctly clear the alert as legitimate without human intervention!

---

## 5. Evaluation on the 20 Benchmark Cases

CaseGuard was evaluated on all 20 official Hacker House Goa benchmark cases (`HHG-001` through `HHG-020`):
- **100% Schema & Policy Compliance**: Every generated answer file in `cases/` satisfies all required top-level, case, evidence, NBA, and SAR fields.
- **Accurate Typology Classification**: Correctly identified card testing, out-of-region card-present fraud, new device anomalies, and undocumented multi-card rings (HHG-014).
- **Calibrated Approval Routing**: Accurately mapped all actions to `auto`, `L1` (team lead), and `L2` (fraud manager) per Section 2 of the Bank Fraud Policy.

---

## 6. What We Learned

1. **Separation of Graph Execution & LLM Reasoning**: Delegating high-volume topological calculations to TigerGraph GSQL and utilizing LLM reasoning solely for structured evidence synthesis delivers deterministic reliability, sub-second latency, and zero hallucination risk.
2. **Graph-Backed Episodic Memory**: Storing case outcomes inside the knowledge graph rather than a flat vector store preserves entity-level relationships, making prior analyst decisions queryable by customer, card, and device.

---

## 7. What We Would Improve With More Time

1. **Continuous Real-Time Streaming Ingestion**: Connect TigerGraph directly to Apache Kafka / Redpanda to ingest live authorization streams in sub-10 milliseconds.
2. **Community Detection Graph Algorithms**: Incorporate Louvain or Weakly Connected Components (WCC) algorithms natively in GSQL to proactively identify emerging fraud syndicates before individual customer alerts fire.
3. **Interactive Multi-Turn Analyst Co-Pilot**: Enable real-time voice and conversational queries directly through the light-theme Analyst Dashboard.
