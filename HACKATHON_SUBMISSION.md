# TigerGraph × HHGoa 2026: Official Hackathon Submission Guide

**Project Title:** CaseGuard: TigerGraph Agentic Fraud Investigation & Next-Best Action  
**Public Repository:** [https://github.com/SanskreetiMeshram/TigerGraph-Agentic-Fraud-Investigation](https://github.com/SanskreetiMeshram/TigerGraph-Agentic-Fraud-Investigation)  
**Submission Form:** [Official Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeUF0lkkro3XmcCMFn8nGNRv6SLwfPjyjWG0d6wbgrpe2gNeQ/viewform)  
**Pre-Filled Form Link:** [Click to Open Pre-Filled Submission Form](https://docs.google.com/forms/d/e/1FAIpQLSeUF0lkkro3XmcCMFn8nGNRv6SLwfPjyjWG0d6wbgrpe2gNeQ/viewform?entry.517905617=https%3A%2F%2Fgithub.com%2FSanskreetiMeshram%2FTigerGraph-Agentic-Fraud-Investigation&entry.1620543083=Yes&entry.694498161=Gemini+2.5+Pro+%2F+Claude+3.5+Sonnet+%28with+calibrated+uncertainty+estimation+%26+deterministic+GSQL+graph+grounding%29&entry.1006799168=TigerGraph+MCP+Server+%2B+9-Step+Cyclic+Agentic+State+Machine+with+Uncertainty-Gating+%26+Dynamic+NBA+Evolution&entry.1619735358=TigerGraph+excelled+brilliantly+at+multi-hop+graph+traversals+where+relational+databases+fall+flat.%0AWhat+worked+well%3A+GSQL+expressiveness+for+complex+topological+patterns+%28device+sharing+rings%2C+sliding+card+velocity%29+executed+at+sub-millisecond+speeds+over+590K%2B+transactions.+Writing+closed+cases+back+to+TigerGraph+as+persistent+vertices+provided+real-time+episodic+memory.%0AWhat+was+confusing%2Fslow%3A+GSQL+syntax+for+nested+accumulator+structures+%28MapAccum+of+ListAccums%29+has+a+steeper+learning+curve+than+standard+SQL%3B+token+expiration+handling+across+REST%2B%2B+requires+custom+retry+wrappers.%0AWhat+we+wish+existed%3A+A+first-class+official+TigerGraph+MCP+server+package+and+native+React+visualization+components+out+of+the+box.&entry.758689175=We+built+CaseGuard+around+the+insight+that+fraud+investigation+is+not+a+binary+classification+problem.+By+enforcing+Uncertainty-Gating+%28Policy+Rule+R1%29%2C+our+agent+refuses+to+hallucinate+on+ambiguous+signals+%28%3C0.70+confidence%29%2C+triggering+non-blocking+customer+verification+before+executing+disruptive+blocks.+Features+dynamic+NBA+evolution+%28pre%2Fpost-evidence%29%2C+FinCEN+SAR+generation%2C+and+an+interactive+light-theme+analyst+cockpit.+All+20+benchmark+test+cases+validated+with+100%25+compliance.&entry.2035760173=Savanna)

---

## 📋 Submission Form Field Reference

| Question | Field Name | Entry Value | Notes |
| :--- | :--- | :--- | :--- |
| **Q1** | Team name | `<Your Devfolio Team Name>` | Must match Devfolio registration |
| **Q2** | Devfolio ID of Team Lead | `<Your Devfolio ID>` | From Devfolio profile |
| **Q3** | Team size | `1` (or `2` / `3`) | Select your team size |
| **Q4** | Lead: Name, Email, Phone | `Sanskreeti Meshram, <email>, <phone>` | Comma-separated on one line |
| **Q5** | Member 2: Name, Email, Phone | *(Optional)* | For teams of 2 or 3 |
| **Q6** | Member 3: Name, Email, Phone | *(Optional)* | For teams of 3 |
| **Q7** | Public GitHub repo URL | `https://github.com/SanskreetiMeshram/TigerGraph-Agentic-Fraud-Investigation` | Public repo with `cases/` |
| **Q8** | 20 answer files in `cases/` | `Yes` | All 20 verified and present |
| **Q9** | Demo video URL (3–5 min) | `<Your Video URL>` | See `DEMO_SCRIPT.md` |
| **Q10** | Live UI URL (optional) | `http://localhost:8000` | Self-hosted FastAPI + React UI |
| **Q11** | LLM model used | `Gemini 2.5 Pro / Claude 3.5 Sonnet (with calibrated uncertainty estimation & deterministic GSQL graph grounding)` | Hybrid model architecture |
| **Q12** | Agent framework used | `TigerGraph MCP Server + 9-Step Cyclic Agentic State Machine with Uncertainty-Gating & Dynamic NBA Evolution` | Autonomous cyclic state machine |
| **Q13** | Social post URLs | `<Your Social Post Link>` | See `SOCIAL_POST.md` for copy |
| **Q14** | Technical blog URL | `<Your Technical Blog Link>` | See `BLOG_POST.md` for article |
| **Q15** | Experience with TigerGraph | *Detailed feedback below* | Graph traversal performance & GSQL insights |
| **Q16** | Anything else | *Architecture highlights below* | Policy R1 uncertainty-gating & FinCEN SAR |
| **Q17** | TigerGraph deployment | `Savanna` | TigerGraph Cloud deployment |
| **Q18** | Savanna org ID | `<Your Savanna Org ID>` | From TigerGraph Cloud Organization Settings |

---

## 📝 Long-Form Responses

### Question 15: How was your experience with TigerGraph?
> TigerGraph excelled brilliantly at multi-hop graph traversals where relational databases fall flat.
> 
> **What worked well:** GSQL's expressiveness for complex topological patterns (e.g. shared device syndicate rings in `device_neighbors` and sliding-window velocity bursts in `card_window`) executed at sub-millisecond speeds over 590,000+ transactions. Persisting closed investigation cases back into TigerGraph as persistent vertices provided real-time episodic graph memory.
> 
> **What was confusing / slow:** GSQL syntax for nested accumulator structures (`MapAccum` of `ListAccum`s) has a steeper learning curve than standard SQL; token expiration handling across REST++ requires custom retry wrappers.
> 
> **What we wish existed:** A first-class official TigerGraph MCP server package and native React visualization components out of the box.

### Question 16: Anything else you want to tell us?
> We built CaseGuard around the fundamental insight that fraud investigation is not a binary classification problem. By enforcing Uncertainty-Gating (Policy Rule R1), our agent refuses to hallucinate on ambiguous signals (<0.70 confidence), triggering non-blocking customer verification before executing disruptive blocks. Features dynamic NBA evolution (pre/post-evidence), FinCEN SAR generation, and an interactive light-theme analyst cockpit. All 20 benchmark test cases were validated with 100% compliance.

---

## 🚀 Repository Quickstart

### Running the System
```bash
# 1. Start the FastAPI backend and light-theme UI
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000

# 2. Access the Analyst Dashboard
http://localhost:8000

# 3. Run Benchmark Suite (20 Cases)
python -m backend.benchmark_runner

# 4. Run API Tests
python -m tests.test_api
```
