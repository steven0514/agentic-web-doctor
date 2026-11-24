# Agentic Web Doctor — Cognizant Open Agentic Web Challenge 參賽專案

## 1. 專案目標
參與 [Cognizant Open Agentic Web Challenge](https://cognizant-agenticweb.devpost.com/)（總獎池 \$10,000～\$13,000，截止 2027-01-11），打造 **Agentic Web Doctor**：一個 100% 符合 `MVP Profile 0.3` 規格的純靜態多代理網站與開發者社群工具，提供：
1. **即時合規稽核（Manifest & Network Auditor）**：檢查任意公開 URL 或貼上之 JSON 是否符合 Open Agentic Web 規格（`agent-manifest.json`、`.network.json`、`agent-mcp.json`、`links.json`、`peer_policy`）。
2. **資安邊界審查（Security Gate Inspector）**：檢核跨站 `allowed_peers` 政策、私密資料（`sly_data`）過濾與 BYOK 金鑰安全。
3. **一鍵合規生成器（Scaffold Architect）**：為任意網站生成可直接部署於 GitHub Pages 的合規 `agent-manifest.json` + `.network.json` + `links.json` 套件。
4. **自舉驗證（Self-Audit）**：支援一鍵對本站自身進行即時合規檢測，驗證 100/100 過關。

## 2. 核心檔案結構（純靜態，可直接部署 GitHub Pages）
- `agent-manifest.json`：站點代理網路公開清單（符合 MVP Profile 0.3）
- `agentic_web_doctor.network.json`：4-Agent 多代理網路定義檔（`doctor_coordinator` + `manifest_auditor` + `security_gate_inspector` + `scaffold_architect`）
- `agent-mcp.json`：MCP 工具能力描述檔
- `links.json`：跨站 Peer-Link 設定檔
- `index.html`、`styles.css`、`runtime/agent-runtime.js`、`app.js`：瀏覽器端多代理 Runtime、Site Actions、WebMCP 工具註冊、BYOK 金鑰管理與視覺化互動介面
- `tests/verify_spec.py`：使用 `uv .venv` 執行之自動化規格與契約驗證測試

## 3. 安全紅線（遵循根目錄 `SECURITY_GATE.md`）
- **純靜態前端**：無需後端伺服器，本地預覽僅綁定 `127.0.0.1`。
- **BYOK 金鑰零外洩**：訪客輸入的 LLM API Key 僅存於瀏覽器 `localStorage`，絕不硬編碼於程式碼或上傳至任何第三方伺服器。
- **無 Key 本地模式**：提供完整的確定性本地代理引擎，評審無須提供 API Key 即可完整體驗所有多代理協作與檢核功能。
