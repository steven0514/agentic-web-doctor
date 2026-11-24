# Devpost Submission Draft — Agentic Web Doctor

## Project Name
**Agentic Web Doctor**

## Tagline (<= 120 chars)
A conforming Open Agentic Website (MVP 0.3) that audits, secures, and scaffolds other agentic websites in your browser.

---

## Inspiration
Building for the Open Agentic Web (MVP Profile 0.3) introduces new web primitives: `agent-manifest.json`, portable Neuro SAN `.network.json` graphs, `peer_policy` trust boundaries, BYOK routers, and WebMCP. Developers often struggle to verify whether their static site actually passes Stage One conformance or accidentally leaks credentials or unsafe peer policies. We asked: **what if the best way to grow the Open Agentic Web is a conforming agentic website whose own multi-agent network helps developers audit, secure, and scaffold their sites?**

## What it does
- **Self-Auditing Meta-Agentic Site**: Runs a 4-agent network (`doctor_coordinator`, `manifest_auditor`, `security_gate_inspector`, `scaffold_architect`) entirely in the browser.
- **Live 10-Point Conformance Auditor**: Audits any CORS-enabled agentic website (including one-click live verification of Cognizant's official `Little Oven Pizza` example), pasted JSON manifests, or itself (**100/100 Self-Audit**).
- **Security Gate Inspector**: Detects hardcoded API key patterns, wildcard `allowed_peers` without consent, unbounded `max_execution_seconds`, and verifies visitor BYOK sovereignty.
- **One-Click Scaffold Generator**: Produces downloadable, GitHub Pages-ready `agent-manifest.json` and `.network.json` bundles tailored to SaaS docs, e-commerce, open-source repos, and local services.
- **WebMCP + Dual-Mode Runtime**: Registers structured tools via `navigator.modelContext.registerTool` and supports both **BYOK** (localStorage-only) and a **Zero-Key Local Deterministic Runtime**.

## How we built it
Pure standard web technologies (**HTML, CSS, ES Modules JavaScript, JSON**) with zero required backend or build toolchain, conforming strictly to `cognizant-ai-labs/agentic-web` **MVP Profile 0.3** (`agent-manifest.json`, `.network.json`, `agent-mcp.json`, `links.json`) plus automated Python `unittest` conformance & secret-leak contract tests.

## Challenges we ran into
Designing a browser-side runtime that works seamlessly both with visitor-supplied BYOK endpoints and completely offline (for instant zero-friction judging), while safely inspecting remote CORS-enabled manifests without forwarding credentials across origins.

## What's next
- Adding visual HOCON-to-JSON live conversion in-browser.
- Supporting multi-hop peer-site graph visualization (`links.json` import/export explorer).
- Contributing `Agentic Web Doctor` to `cognizant-ai-labs/agentic-web/docs/agentic_websites.md`.

---

## 🎬 Under-2-Minute Demo Video Script (Target: 1:45 — Strictly < 2:00 Rule)
1. **0:00 – 0:20 (Hook & Self-Audit)**: Open the live GitHub Pages URL in Chrome. Show the 4-agent topology graph lighting up as `Run Self-Audit` scores **100/100 (Stage One PASS, Security Gate SAFE)**.
2. **0:20 – 0:50 (Live External CORS Audit)**: Click `🍕 Official Example` to fetch Cognizant's live `Little Oven Pizza` manifest via CORS and show the real-time 10-point breakdown + Security Gate findings (XSS-escaped output).
3. **0:50 – 1:15 (One-Click Scaffold Generator)**: Switch to `Scaffold Generator`, enter a brand name, click `Generate Compliant Bundle`, and download both `agent-manifest.json` and `.network.json`.
4. **1:15 – 1:35 (Interactive Console & BYOK Sovereignty)**: Click a sample query in the right-hand chat console, open `🔑 BYOK Settings` to show browser-local `localStorage` sovereignty and Zero-Key deterministic fallback.
5. **1:35 – 1:45 (Closing)**: Briefly show `./agent-manifest.json` and `./agentic_web_doctor.network.json` — 100% static, portable, and ready for the Open Agentic Web.
