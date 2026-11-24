# -*- coding: utf-8 -*-
"""Agentic Web Doctor — MVP Profile 0.3 合規與資安契約自動化驗證腳本"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class TestOpenAgenticWebConformance(unittest.TestCase):
    def test_required_public_artifacts_exist_and_valid_json(self):
        required = [
            "agent-manifest.json",
            "agentic_web_doctor.network.json",
            "agent-mcp.json",
            "links.json",
        ]
        for fname in required:
            p = ROOT / fname
            self.assertTrue(p.exists(), f"缺少公開規格檔：{fname}")
            data = json.loads(p.read_text(encoding="utf-8"))
            self.assertIsInstance(data, dict)

    def test_manifest_and_network_graph_integrity(self):
        manifest = json.loads((ROOT / "agent-manifest.json").read_text(encoding="utf-8"))
        self.assertTrue(manifest.get("brand"))
        self.assertTrue(manifest.get("networks"))
        net_meta = manifest["networks"][0]
        hocon_path = (ROOT / net_meta["hocon"]).resolve()
        self.assertTrue(hocon_path.exists(), f"hocon 指向之檔案不存在：{hocon_path}")

        network = json.loads(hocon_path.read_text(encoding="utf-8"))
        tool_names = {t["name"] for t in network.get("tools", [])}
        self.assertIn(net_meta["front_man"], tool_names, "front_man 必須存在於 network.tools[]")

        # 驗證下游代理參照無斷鏈
        for t in network.get("tools", []):
            for child in t.get("tools", []):
                self.assertIn(child, tool_names, f"下游代理 {child} 未定義於 tools[]")

        # 驗證安全與 BYOK 欄位
        self.assertIn(manifest.get("peer_policy", {}).get("mode"), ("closed", "consent-required"))
        self.assertTrue(manifest.get("deployment", {}).get("direct_byok"))
        self.assertLessEqual(network.get("max_execution_seconds", 9999), 600)

    def test_zero_hardcoded_secrets_across_project(self):
        secret_re = re.compile(r"(sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z-_]{30,}|ghp_[A-Za-z0-9]{20,})")
        for ext in ("*.json", "*.js", "*.html", "*.css"):
            for fp in ROOT.rglob(ext):
                if ".venv" in fp.parts:
                    continue
                content = fp.read_text(encoding="utf-8", errors="ignore")
                self.assertIsNone(secret_re.search(content), f"偵測到疑似硬編碼密鑰：{fp}")

    def test_frontend_xss_escaping_and_static_assets(self):
        app_js = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("function escapeHtml(", app_js, "app.js 必須實作 escapeHtml() 防範遠端 Manifest DOM XSS")
        self.assertIn("escapeHtml(title)", app_js)
        self.assertIn("escapeHtml(c.detail)", app_js)
        self.assertIn("escapeHtml(f.detail)", app_js)
        for asset in ("index.html", "styles.css", "runtime/agent-runtime.js", "LICENSE", "README.md"):
            self.assertTrue((ROOT / asset).exists(), f"缺少必要交付檔案：{asset}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
