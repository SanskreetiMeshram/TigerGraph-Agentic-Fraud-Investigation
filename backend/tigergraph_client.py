"""
TigerGraph Savanna and Community Edition Client
Handles authentication, REST API interactions, query execution, and vertex/edge upserts.
"""

import os
import requests
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

class TigerGraphClient:
    def __init__(
        self,
        host: Optional[str] = None,
        graphname: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        secret: Optional[str] = None,
        token: Optional[str] = None,
        restpp_port: int = 9000,
        gs_port: int = 14240,
        use_https: bool = True
    ):
        self.host = host or os.getenv("TIGERGRAPH_HOST", "")
        self.graphname = graphname or os.getenv("TIGERGRAPH_GRAPHNAME", "FraudGraph")
        self.username = username or os.getenv("TIGERGRAPH_USERNAME", "tigergraph")
        self.password = password or os.getenv("TIGERGRAPH_PASSWORD", "tigergraph")
        self.secret = secret or os.getenv("TIGERGRAPH_SECRET", "")
        self.token = token or os.getenv("TIGERGRAPH_TOKEN", "")
        self.restpp_port = restpp_port
        self.gs_port = gs_port
        self.use_https = use_https or (self.host.startswith("https://") if self.host else True)
        
        self.is_configured = bool(self.host and "your-subdomain" not in self.host)
        self.base_url = self.host.rstrip("/") if self.host else ""
        if self.base_url and not self.base_url.startswith("http"):
            protocol = "https" if self.use_https else "http"
            self.base_url = f"{protocol}://{self.base_url}"

    def get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def test_connection(self) -> Dict[str, Any]:
        """Tests connection to TigerGraph Savanna or Community instance."""
        if not self.is_configured or not self.base_url:
            return {
                "connected": False,
                "message": "Live TigerGraph host not configured in .env. Running on High-Speed Graph Engine.",
                "fallback_mode": "In-Memory Graph Engine Active"
            }

        try:
            url = f"{self.base_url}/echo"
            resp = requests.get(url, headers=self.get_headers(), timeout=4)
            if resp.status_code == 200:
                return {"connected": True, "message": "Successfully connected to TigerGraph Savanna", "status": 200}
        except Exception:
            pass

        try:
            url = f"{self.base_url}/restpp/version"
            resp = requests.get(url, headers=self.get_headers(), timeout=4)
            if resp.status_code == 200:
                return {"connected": True, "message": resp.text, "status": 200}
        except Exception as e:
            return {
                "connected": False,
                "message": f"TigerGraph instance unreachable: {str(e)}",
                "fallback_mode": "In-Memory Graph Engine Active"
            }

        return {
            "connected": False,
            "message": f"Could not reach TigerGraph at {self.base_url}",
            "fallback_mode": "In-Memory Graph Engine Active"
        }

    def run_installed_query(self, query_name: str, params: Optional[Dict[str, Any]] = None) -> Optional[List[Dict[str, Any]]]:
        """Runs a pre-installed GSQL query on TigerGraph if configured."""
        if not self.is_configured or not self.base_url:
            return None

        url = f"{self.base_url}/restpp/query/{self.graphname}/{query_name}"
        try:
            resp = requests.get(url, headers=self.get_headers(), params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if not data.get("error"):
                    return data.get("results", [])
        except Exception:
            pass
        return None

    def upsert_vertex(self, vertex_type: str, vertex_id: str, attributes: Dict[str, Any]) -> bool:
        """Upserts a vertex into TigerGraph if configured."""
        if not self.is_configured or not self.base_url:
            return False

        url = f"{self.base_url}/restpp/graph/{self.graphname}"
        payload = {
            "vertices": {
                vertex_type: {
                    vertex_id: attributes
                }
            }
        }
        try:
            resp = requests.post(url, headers=self.get_headers(), json=payload, timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

tigergraph_client = TigerGraphClient()
