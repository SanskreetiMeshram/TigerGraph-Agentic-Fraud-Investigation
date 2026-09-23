# 3–5 Minute Video Demonstration Script: CaseGuard

Use this script to record your winning video demo for the TigerGraph Agentic Fraud Investigation Hackathon.

---

## ⏱️ Video Breakdown

- **0:00 – 0:45**: The Problem & The Solution (The "Binary Fallacy" in Fraud Systems)
- **0:45 – 1:45**: Architecture: TigerGraph, GSQL Analytics & Uncertainty-Gating
- **1:45 – 2:45**: Live Walkthrough: Case HHG-014 (Coordinated Device Syndicate Ring)
- **2:45 – 3:30**: Live Walkthrough: Case HHG-012 (Case Memory & Legitimate Travel Recall)
- **3:30 – 4:15**: NBA Evolution, FinCEN SAR Filing & 20 Benchmark Validation
- **4:15 – 4:45**: Conclusion & Impact on Modern Financial Institutions

---

## 🎙️ Step-by-Step Script

### [0:00 - 0:45] Intro & The Core Problem
* **Visual**: Show the modern light-theme Analyst Dashboard at `http://localhost:8000`.
* **Audio**: 
  > "Hi everyone! Fraud operations at financial institutions are under intense pressure. Millions of dollars are lost each month because investigations are slow, manual, and reactive. Existing automated tools force an aggressive binary choice: either block an innocent customer on a single model score, or let sophisticated fraudsters slip through.
  > Today, we're proud to present **CaseGuard**—an autonomous Agentic Fraud Investigation system powered by TigerGraph that moves from uncertain fraud signals to a defensible course of action. It's built on a simple philosophy: **an investigator that knows what it doesn't know**."

### [0:45 - 1:45] Architecture & TigerGraph Backbone
* **Visual**: Click on the **Graph Visualizer** tab and open the **Fraud Policy** reference modal.
* **Audio**:
  > "Instead of forcing an LLM to guess graph calculations, CaseGuard delegates 100% of topological analysis to **TigerGraph Savanna** and **GSQL analytics**.
  > Using queries like `card_window`, `device_neighbors`, and `region_burst`, CaseGuard traces multi-hop links across more than 590,000 transactions from the IEEE-CIS dataset.
  > It features an **Uncertainty-Gated State Machine**: if fraud confidence falls below 70%, it doesn't guess. It initiates controlled, policy-governed evidence gathering—like cardholder verification pings or step-up authentication—before any irreversible block can occur."

### [1:45 - 2:45] Case Demonstration 1: HHG-014 (The Coordinated Device Ring)
* **Visual**: Select **HHG-014** from the left Case Pack navigator. Click **Re-Run Investigation**.
* **Audio**:
  > "Let's look at Case HHG-014, triggered by an analyst request noting suspicious device behavior.
  > Notice the interactive TigerGraph subgraph on screen. By running our `device_neighbors` GSQL query, the agent discovered that this single Samsung device—routing through an anonymous proxy—is shared across **52 distinct customer cards**!
  > Look at the **Next-Best Action Decision Evolution**: 
  > Initially, it issued an automatic challenge. But once the graph ring was confirmed, the agent updated the final action to `BLOCK_CARD`, opened an internal fraud case, mandated a regulatory **FinCEN SAR filing**, and put all 51 connected cards under active surveillance under Policy Rule R6."

### [2:45 - 3:30] Case Demonstration 2: HHG-012 (TigerGraph Case Memory at Work)
* **Visual**: Click on **HHG-012** in the Case Pack selector.
* **Audio**:
  > "Now let's see how CaseGuard prevents false positives using **TigerGraph Case Memory**.
  > Case HHG-012 flagged an in-person charge in billing region 494.0 with a moderate risk score of 0.55. A traditional model would often decline this as an out-of-region anomaly.
  > But CaseGuard queried historical closed cases in graph memory and retrieved **Case CC-0003** from August, where this exact customer had previously confirmed legitimate travel to region 494.0!
  > Recognizing the customer's travel history, the agent calibrated the probability down to 8% and safely cleared the alert as legitimate without interrupting the cardholder's spending."

### [3:30 - 4:15] SAR Regulatory Report & 20 Benchmark Validation
* **Visual**: Click **View SAR Filing Record** on Case HHG-014, then show the terminal running `python -m backend.benchmark_runner`.
* **Audio**:
  > "Whenever fraud exceeds $1,000 or involves coordinated rings, CaseGuard automatically drafts a complete 6-to-12 sentence FinCEN-compliant Suspicious Activity Report narrative, naming all subjects, cards, and devices.
  > We ran CaseGuard across all 20 official benchmark cases in the hackathon case pack. Every single case passed automated validation with 100% compliance against the answer specification."

### [4:15 - 4:45] Conclusion
* **Visual**: Return to the full dashboard view, showing the light-theme UI and graph nodes.
* **Audio**:
  > "By combining TigerGraph's sub-millisecond graph analytics with uncertainty-gated agentic reasoning, CaseGuard empowers fraud teams to act faster, eliminate false positives, and stop financial crime before the money leaves the bank.
  > Thank you to TigerGraph and Hacker House Goa!"
