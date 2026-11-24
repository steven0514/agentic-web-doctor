/**
 * Agentic Web Doctor — Browser-Side Multi-Agent Runtime (MVP Profile 0.3)
 * 純靜態瀏覽器端多代理執行引擎：
 * - 載入公開 agent-manifest.json 與 resolved .network.json
 * - 支援無 API Key 確定性專家模式（評審免輸入 Key 即可完整體驗）
 * - 支援 BYOK（Bring Your Own Key）OpenAI-compatible / Otari / OpenRouter / Gemini 端點
 * - 註冊瀏覽器原生 WebMCP 工具（navigator.modelContext.registerTool）
 */

export class AgenticWebDoctorRuntime {
  constructor() {
    this.manifest = null;
    this.network = null;
    this.mcpSpec = null;
    this.linksSpec = null;
    this.byokConfig = this.loadByokConfig();
    this.onAgentTrace = null;
  }

  /** 從瀏覽器 localStorage 讀取 BYOK 設定（絕不上傳至任何非使用者指定之伺服器） */
  loadByokConfig() {
    try {
      const raw = localStorage.getItem('awd_byok_config');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      mode: 'local', // 'local' | 'byok'
      baseUrl: 'https://api.otari.ai/api/v1',
      model: 'google/gemini-2.5-flash',
      apiKey: '',
    };
  }

  saveByokConfig(cfg) {
    this.byokConfig = { ...this.byokConfig, ...cfg };
    try {
      localStorage.setItem('awd_byok_config', JSON.stringify(this.byokConfig));
    } catch {}
  }

  /** 載入本站四份公開 Open Agentic Web 規格檔並註冊 WebMCP 工具 */
  async init() {
    const [mRes, mcpRes, linkRes] = await Promise.all([
      fetch('./agent-manifest.json'),
      fetch('./agent-mcp.json'),
      fetch('./links.json'),
    ]);
    this.manifest = await mRes.json();
    this.mcpSpec = await mcpRes.json();
    this.linksSpec = await linkRes.json();

    const netPath = this.manifest?.networks?.[0]?.hocon || './agentic_web_doctor.network.json';
    const nRes = await fetch(netPath);
    this.network = await nRes.json();

    this.registerWebMcpTools();
    return { manifest: this.manifest, network: this.network };
  }

  /** 若瀏覽器支援 WebMCP (navigator.modelContext)，自動註冊結構化工具 */
  registerWebMcpTools() {
    const api = {
      audit_agentic_site: ({ manifest, network }) => this.auditConformance(manifest, network),
      inspect_security_gate: ({ manifest, network }) => this.inspectSecurityGate(manifest, network),
      generate_agentic_scaffold: ({ brand, domainType }) => this.generateScaffold(brand, domainType),
    };
    window.agenticWebDoctor = api;

    if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
      for (const tool of this.mcpSpec?.tools || []) {
        try {
          navigator.modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: async (args) => api[tool.name](args || {}),
          });
        } catch {}
      }
    }
  }

  emitTrace(agentName, status, detail) {
    if (typeof this.onAgentTrace === 'function') {
      this.onAgentTrace({ agentName, status, detail, ts: new Date().toISOString() });
    }
  }

  /** 專科代理 1：manifest_auditor（10 項 MVP Profile 0.3 確定性合規稽核） */
  auditConformance(manifest, network = null) {
    this.emitTrace('manifest_auditor', 'running', 'Checking 10 MVP Profile 0.3 conformance criteria...');
    const checks = [];
    const add = (id, label, passed, weight, detail) => {
      checks.push({ id, label, passed: Boolean(passed), weight, detail });
    };

    const m = manifest || {};
    const nets = Array.isArray(m.networks) ? m.networks : [];
    const firstNet = nets[0] || {};
    const tools = Array.isArray(network?.tools) ? network.tools : [];

    add('brand', 'Site Brand & Identity', Boolean(m.brand && typeof m.brand === 'string'), 10,
      m.brand ? `Brand declared: "${m.brand}"` : 'Missing top-level "brand" string.');

    add('networks', 'Published Networks Array', nets.length > 0 && Boolean(firstNet.name && firstNet.front_man && firstNet.hocon), 15,
      nets.length > 0 ? `Found ${nets.length} network(s); front_man="${firstNet.front_man}"` : 'Missing networks[] with name, front_man, and hocon.');

    add('network_graph', 'Portable Neuro SAN Network JSON', tools.length > 0 && tools.some(t => t.name === firstNet.front_man), 15,
      tools.length > 0 ? `Resolved ${tools.length} agent(s) in tools[]; front_man verified.` : 'Network JSON missing or front_man not found in tools[].');

    add('byok_router', 'Pluggable Inference / BYOK Router', Boolean(m.llm_router && (m.llm_router.base_url || m.llm_router.byok_router)), 10,
      m.llm_router ? `Router configured (${m.llm_router.byok_router || m.llm_router.base_url}).` : 'Missing llm_router configuration.');

    add('peer_policy', 'Explicit Peer Policy & Trust Metadata', Boolean(m.peer_policy && m.peer_policy.mode), 10,
      m.peer_policy ? `peer_policy.mode = "${m.peer_policy.mode}"` : 'Missing peer_policy.mode.');

    add('linking', 'Cross-Site Linking Exports', Boolean(m.linking && Array.isArray(m.linking.exports) && m.linking.exports.length > 0), 10,
      m.linking?.exports?.length ? `Exports ${m.linking.exports.length} network(s) via ${m.linking.protocol || 'link'}.` : 'Missing linking.exports[].');

    add('deployment', 'Static Browser-Runtime Metadata', Boolean(m.deployment && m.deployment.self_contained_runtime), 10,
      m.deployment ? `mode="${m.deployment.mode}", direct_byok=${Boolean(m.deployment.direct_byok)}` : 'Missing deployment metadata.');

    add('sample_queries', 'Discoverable Sample Queries', Array.isArray(firstNet.sample_queries) && firstNet.sample_queries.length >= 2, 5,
      firstNet.sample_queries ? `${firstNet.sample_queries.length} sample queries published.` : 'Add at least 2 sample_queries.');

    add('mcp_webmcp', 'MCP / WebMCP Discovery Metadata', Boolean(m.agent_mcp && m.agent_mcp.protocol), 10,
      m.agent_mcp ? `Protocol: ${m.agent_mcp.protocol} (webmcp=${Boolean(m.agent_mcp.webmcp)})` : 'Missing agent_mcp descriptor.');

    add('actions', 'Typed Site Actions Declaration', Boolean(m.actions && (Array.isArray(m.actions.items) || m.actions.version)), 5,
      m.actions ? `Site actions schema v${m.actions.version || 1} declared.` : 'No site actions declared.');

    const score = checks.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
    const stageOnePass = checks.filter(c => ['brand', 'networks', 'network_graph', 'byok_router'].includes(c.id)).every(c => c.passed);

    this.emitTrace('manifest_auditor', 'done', `Score ${score}/100 (Stage One: ${stageOnePass ? 'PASS' : 'FAIL'})`);
    return { score, stageOnePass, checks };
  }

  /** 專科代理 2：security_gate_inspector（資安邊界與私密欄位稽核） */
  inspectSecurityGate(manifest, network = null) {
    this.emitTrace('security_gate_inspector', 'running', 'Inspecting peer_policy, credential leaks & execution bounds...');
    const findings = [];
    const serialized = JSON.stringify({ manifest, network });

    // 1. 檢查是否硬編碼常見金鑰
    const leakPattern = /(sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z-_]{30,}|ghp_[A-Za-z0-9]{20,})/;
    if (leakPattern.test(serialized)) {
      findings.push({ level: 'FAIL', title: 'Hardcoded Secret Detected', detail: 'Detected API key pattern inside public JSON artifact. Move all keys to browser-local BYOK storage.' });
    } else {
      findings.push({ level: 'PASS', title: 'Zero Hardcoded Credentials', detail: 'No API keys or personal tokens found in public manifest/network JSON.' });
    }

    // 2. 檢查 peer_policy 與 allowed_peers
    const mode = manifest?.peer_policy?.mode;
    const peers = manifest?.allowed_peers || [];
    if (peers.includes('*') && mode !== 'consent-required') {
      findings.push({ level: 'FAIL', title: 'Wildcard Peer Access Without Consent', detail: 'allowed_peers includes "*" without consent-required policy.' });
    } else if (!mode) {
      findings.push({ level: 'WARN', title: 'Unspecified Peer Policy', detail: 'Explicitly set peer_policy.mode to "closed" or "consent-required".' });
    } else {
      findings.push({ level: 'PASS', title: 'Safe Peer Trust Boundary', detail: `Peer linking governed by mode="${mode}" (${peers.length} pre-allowed peers).` });
    }

    // 3. 檢查執行時間上限
    const maxSec = network?.max_execution_seconds;
    if (typeof maxSec === 'number' && maxSec > 0 && maxSec <= 600) {
      findings.push({ level: 'PASS', title: 'Bounded Execution Timeout', detail: `max_execution_seconds=${maxSec}s prevents runaway loops.` });
    } else {
      findings.push({ level: 'WARN', title: 'Unbounded Execution Time', detail: 'Set max_execution_seconds (<= 600) in network.json.' });
    }

    // 4. 檢查 BYOK 隔離
    if (manifest?.deployment?.direct_byok) {
      findings.push({ level: 'PASS', title: 'Visitor BYOK Sovereignty', detail: 'Browser-local BYOK enabled; site host does not proxy or store visitor keys.' });
    } else {
      findings.push({ level: 'WARN', title: 'BYOK Not Declared', detail: 'Set deployment.direct_byok=true to clarify visitor key control.' });
    }

    const hasFail = findings.some(f => f.level === 'FAIL');
    const posture = hasFail ? 'BLOCKED' : findings.some(f => f.level === 'WARN') ? 'REVIEW' : 'SAFE';
    this.emitTrace('security_gate_inspector', 'done', `Security Gate: ${posture}`);
    return { posture, findings };
  }

  /** 專科代理 3：scaffold_architect（一鍵生成合規 MVP 0.3 JSON 套件） */
  generateScaffold(brand = 'My Agentic Site', domainType = 'saas-docs') {
    this.emitTrace('scaffold_architect', 'running', `Generating MVP 0.3 bundle for "${brand}" (${domainType})...`);
    const slug = (brand || 'my_agentic_site')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'my_agentic_site';

    const presets = {
      'saas-docs': {
        desc: `Interactive documentation, API troubleshooting, and onboarding agent network for ${brand}.`,
        agents: ['docs_navigator', 'api_troubleshooter'],
        queries: [
          `How do I authenticate with the ${brand} API?`,
          `Give me a quickstart snippet for ${brand}.`,
        ],
      },
      ecommerce: {
        desc: `Product discovery, sizing, dietary/spec checks, and cart assistant for ${brand}.`,
        agents: ['catalog_specialist', 'order_assistant'],
        queries: [
          `What are the best-selling items at ${brand}?`,
          `Help me compare two products and check shipping options.`,
        ],
      },
      'opensource-project': {
        desc: `Contributor guide, issue triage, and architecture explainer for ${brand}.`,
        agents: ['architecture_guide', 'contributor_mentor'],
        queries: [
          `How is the ${brand} repository structured?`,
          `Show me good first issues and local test commands.`,
        ],
      },
      'local-service': {
        desc: `Booking, service catalog, hours, and FAQ agent network for ${brand}.`,
        agents: ['service_advisor', 'booking_coordinator'],
        queries: [
          `What services and pricing does ${brand} offer?`,
          `How do I book an appointment this week?`,
        ],
      },
    };
    const p = presets[domainType] || presets['saas-docs'];
    const frontMan = `${slug}_coordinator`;

    const manifest = {
      brand,
      spec_profile: 'worldwide-agentic-web-mvp/0.3',
      networks: [
        {
          name: `${slug}_assistant`,
          front_man: frontMan,
          hocon: `./${slug}_assistant.network.json`,
          description: p.desc,
          tags: ['deployed', domainType, 'mvp-0.3'],
          sample_queries: p.queries,
        },
      ],
      llm_router: {
        base_url: 'https://api.otari.ai/api/v1',
        mock: false,
        byok_router: 'https://api.otari.ai/api/v1',
      },
      allowed_peers: [],
      peer_policy: {
        mode: 'consent-required',
        deny_origins: [],
        note: 'Generated by Agentic Web Doctor with safe trust-boundary defaults.',
      },
      agent_mcp: {
        protocol: 'nsdeploy-agent-mcp/v1',
        network: `${slug}_assistant`,
        front_man: frontMan,
        available: false,
        reason: 'Static bundle; enable WebMCP or attach a CORS-enabled MCP host.',
      },
      linking: {
        protocol: 'nsdeploy-link/v1',
        exports: [{ network: `${slug}_assistant`, front_man: frontMan, aliases: [frontMan], url: `${slug}_assistant` }],
        imports: [],
        link_updates: { mode: 'browser-local' },
      },
      deployment: {
        mode: 'static',
        self_contained_runtime: true,
        browser_mock: false,
        direct_byok: true,
        direct_mcp_requires_cors: true,
        public_mcp_facade: false,
      },
    };

    const network = {
      aaosa_instructions: 'Use relevant downstream agents when their expertise helps, then consolidate into one concise answer.',
      aaosa_call: {
        description: 'Route user inquiry across specialist agents.',
        parameters: {
          type: 'object',
          properties: {
            inquiry: { type: 'string' },
            mode: { type: 'string' },
          },
          required: ['inquiry', 'mode'],
        },
      },
      metadata: {
        name: brand,
        sample_queries: p.queries,
        date_created: new Date().toISOString(),
      },
      llm_config: { model_name: 'google/gemini-2.5-flash' },
      max_execution_seconds: 120,
      instructions_prefix: `Act as the official Open Agentic Web assistant for ${brand}.`,
      tools: [
        {
          name: frontMan,
          function: { description: p.desc, parameters: { type: 'object', properties: { inquiry: { type: 'string' }, mode: { type: 'string' } }, required: ['inquiry', 'mode'] } },
          instructions: `Coordinate ${p.agents.join(' and ')} to answer visitor inquiries accurately.`,
          tools: p.agents,
        },
        ...p.agents.map((ag) => ({
          name: ag,
          function: { description: `Specialist sub-agent (${ag}) for ${brand}.`, parameters: { type: 'object', properties: { inquiry: { type: 'string' }, mode: { type: 'string' } }, required: ['inquiry', 'mode'] } },
          instructions: `Provide accurate domain answers for ${ag} on ${brand}.`,
          tools: [],
        })),
      ],
    };

    this.emitTrace('scaffold_architect', 'done', `Generated ${slug}_assistant bundle`);
    return { slug, manifest, network };
  }

  /** 透過 CORS 抓取外部公開網站的 agent-manifest.json 並進行稽核 */
  async auditRemoteUrl(baseUrl) {
    const cleanBase = baseUrl.trim().replace(/\/+$/, '');
    const manifestUrl = cleanBase.endsWith('.json') ? cleanBase : `${cleanBase}/agent-manifest.json`;
    const res = await fetch(manifestUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${manifestUrl}`);
    const manifest = await res.json();

    let network = null;
    const hoconRel = manifest?.networks?.[0]?.hocon;
    if (hoconRel) {
      try {
        const netUrl = new URL(hoconRel, manifestUrl).toString();
        const nRes = await fetch(netUrl, { mode: 'cors' });
        if (nRes.ok) network = await nRes.json();
      } catch {}
    }
    const conformance = this.auditConformance(manifest, network);
    const security = this.inspectSecurityGate(manifest, network);
    return { manifestUrl, manifest, network, conformance, security };
  }

  /** 主入口：doctor_coordinator 處理自然語言對話（支援 BYOK 或確定性本地多代理引擎） */
  async chat(userMessage) {
    this.emitTrace('doctor_coordinator', 'running', 'Triaging inquiry across specialist agents...');
    const lower = userMessage.toLowerCase();

    // 1. 執行確定性工具以提供真實接地資料（Grounding）
    let groundedSummary = '';
    if (lower.includes('self-audit') || lower.includes('this website') || lower.includes('自我檢測') || lower.includes('本站')) {
      const conf = this.auditConformance(this.manifest, this.network);
      const sec = this.inspectSecurityGate(this.manifest, this.network);
      groundedSummary =
        `**Self-Audit Result: ${conf.score}/100** (Stage One: **${conf.stageOnePass ? 'PASS ✅' : 'FAIL ❌'}**)\n` +
        `**Security Gate Posture:** \`${sec.posture}\`\n\n` +
        conf.checks.map((c) => `- ${c.passed ? '✅' : '❌'} **${c.label}** (${c.weight} pts): ${c.detail}`).join('\n') +
        `\n\n**Security Gate Findings:**\n` +
        sec.findings.map((f) => `- [${f.level}] **${f.title}**: ${f.detail}`).join('\n');
    } else if (lower.includes('security') || lower.includes('peer_policy') || lower.includes('byok') || lower.includes('資安') || lower.includes('安全')) {
      const sec = this.inspectSecurityGate(this.manifest, this.network);
      groundedSummary =
        `**Security Gate Inspector Report** (Posture: \`${sec.posture}\`)\n\n` +
        sec.findings.map((f) => `- [${f.level}] **${f.title}**: ${f.detail}`).join('\n') +
        `\n\n**Best Practices for Open Agentic Websites:**\n` +
        `1. Keep \`peer_policy.mode\` as \`"closed"\` or \`"consent-required"\`.\n` +
        `2. Store visitor API keys strictly in browser \`localStorage\` (BYOK), never in public JSON.\n` +
        `3. Set \`max_execution_seconds <= 600\` to prevent runaway agent loops.`;
    } else if (lower.includes('generate') || lower.includes('scaffold') || lower.includes('生成') || lower.includes('範本')) {
      const type = lower.includes('commerce') || lower.includes('shop') ? 'ecommerce'
        : lower.includes('open') ? 'opensource-project'
        : lower.includes('clinic') || lower.includes('local') ? 'local-service'
        : 'saas-docs';
      const out = this.generateScaffold('Demo Agentic Site', type);
      groundedSummary =
        `**Scaffold Architect Generated (\`${type}\`):**\n` +
        `- Manifest network: \`${out.manifest.networks[0].name}\` (front_man: \`${out.manifest.networks[0].front_man}\`)\n` +
        `- Sub-agents: ${out.network.tools.slice(1).map((t) => `\`${t.name}\``).join(', ')}\n` +
        `- Safe defaults: \`peer_policy.mode="consent-required"\`, \`direct_byok=true\`.\n\n` +
        `👉 Use the **Scaffold Generator** tab on the left to customize the brand name and download both JSON files directly.`;
    } else {
      groundedSummary =
        `**Open Agentic Web (MVP Profile 0.3) Stage One Checklist:**\n` +
        `1. Public \`agent-manifest.json\` listing your \`networks[]\`, \`front_man\`, \`llm_router\`, and \`peer_policy\`.\n` +
        `2. Resolved, data-only Neuro SAN \`.network.json\` describing your multi-agent graph (\`tools[]\`).\n` +
        `3. Browser-side JavaScript runtime executing the network client-side with zero required backend.\n` +
        `4. Visitor-controlled **BYOK** (Bring Your Own Key) configuration UI.\n\n` +
        `Try asking me to **"Run a full Self-Audit"** or **"Generate a scaffold"**!`;
    }

    // 2. 若使用者啟用了 BYOK 模式且填寫了 API Key，透過 OpenAI-compatible 介面進行自然語言精修
    if (this.byokConfig.mode === 'byok' && this.byokConfig.apiKey) {
      try {
        const endpoint = `${this.byokConfig.baseUrl.replace(/\/+$/, '')}/chat/completions`;
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.byokConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: this.byokConfig.model || 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `${this.network?.instructions_prefix || ''}\nGround your response strictly on these verified specialist agent results:\n${groundedSummary}`,
              },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            this.emitTrace('doctor_coordinator', 'done', `Completed via BYOK (${this.byokConfig.model})`);
            return { text, mode: 'byok' };
          }
        }
      } catch (e) {
        groundedSummary += `\n\n> ⚠️ BYOK endpoint unreachable (${e.message}); fell back to local deterministic runtime.`;
      }
    }

    this.emitTrace('doctor_coordinator', 'done', 'Completed via Local Deterministic Runtime');
    return { text: groundedSummary, mode: 'local' };
  }
}
