"""
TigerGraph Model Context Protocol (MCP) Tools Server
Implements MCP tool specifications allowing LLMs and AI Agents to invoke graph queries,
traversals, and case memory updates natively.
"""

from typing import Dict, Any, List, Optional
from backend.graph_engine import graph_engine
from backend.tigergraph_client import tigergraph_client

MCP_TOOL_DEFINITIONS = [
    {
        "name": "tigergraph_card_window",
        "description": "Performs sliding window graph traversal to retrieve transactions around a specific time window to detect bursts, card testing sequences, or velocity spikes.",
        "parameters": {
            "type": "object",
            "properties": {
                "card_id": {"type": "string", "description": "The card identifier, e.g., C12382-K1"},
                "anchor_time": {"type": "string", "description": "Anchor datetime string in YYYY-MM-DD HH:MM:SS format"},
                "hours": {"type": "integer", "description": "Time window in hours (default 48)"}
            },
            "required": ["card_id", "anchor_time"]
        }
    },
    {
        "name": "tigergraph_device_neighbors",
        "description": "Performs multi-hop graph expansion from a device profile to detect device sharing, multi-accounting, fraud rings, or compromised credentials across cards and customers.",
        "parameters": {
            "type": "object",
            "properties": {
                "device_profile": {"type": "string", "description": "Formatted device profile string (DeviceInfo | OS | browser | screen)"}
            },
            "required": ["device_profile"]
        }
    },
    {
        "name": "tigergraph_region_burst",
        "description": "Compares candidate transaction billing region against historical home regions to detect out-of-region card-present fraud vs customer travel.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "The customer ID"},
                "card_id": {"type": "string", "description": "The card ID"},
                "test_region": {"type": "number", "description": "The addr1 billing region code to evaluate"}
            },
            "required": ["customer_id", "card_id", "test_region"]
        }
    },
    {
        "name": "tigergraph_retrieve_case_memory",
        "description": "Retrieves similar historical closed cases and analyst notes to ground the agentic investigation with prior outcomes, travel patterns, or confirmed fraud typologies.",
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Fraud typology pattern if known"},
                "customer_id": {"type": "string", "description": "Customer ID to check for prior complaints or travel confirmations"},
                "card_id": {"type": "string", "description": "Card ID"},
                "limit": {"type": "integer", "description": "Maximum number of past cases to retrieve"}
            }
        }
    },
    {
        "name": "tigergraph_write_case_to_graph",
        "description": "Persists an active or closed investigation case into TigerGraph graph memory, connecting it to transactions, cards, and devices.",
        "parameters": {
            "type": "object",
            "properties": {
                "case_record": {"type": "object", "description": "Full case document conforming to the hackathon answer format"}
            },
            "required": ["case_record"]
        }
    }
]

class TigerGraphMCPServer:
    """Dispatches tool calls from LLMs or Agents to TigerGraph."""

    def list_tools(self) -> List[Dict[str, Any]]:
        return MCP_TOOL_DEFINITIONS

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if name == "tigergraph_card_window":
            return {
                "result": graph_engine.card_window(
                    card_id=arguments.get("card_id"),
                    anchor_time_str=arguments.get("anchor_time"),
                    hours=arguments.get("hours", 48)
                )
            }
        elif name == "tigergraph_device_neighbors":
            return {
                "result": graph_engine.device_neighbors(
                    device_profile=arguments.get("device_profile")
                )
            }
        elif name == "tigergraph_region_burst":
            return {
                "result": graph_engine.region_burst(
                    customer_id=arguments.get("customer_id"),
                    card_id=arguments.get("card_id"),
                    test_region=arguments.get("test_region")
                )
            }
        elif name == "tigergraph_retrieve_case_memory":
            return {
                "result": graph_engine.find_similar_cases(
                    pattern=arguments.get("pattern"),
                    customer_id=arguments.get("customer_id"),
                    card_id=arguments.get("card_id"),
                    limit=arguments.get("limit", 5)
                )
            }
        elif name == "tigergraph_write_case_to_graph":
            graph_id = graph_engine.save_case_memory(
                case_record=arguments.get("case_record")
            )
            return {"graph_case_id": graph_id, "written": True}
        else:
            raise ValueError(f"Unknown TigerGraph MCP tool: {name}")

mcp_server = TigerGraphMCPServer()
