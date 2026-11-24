import { AgenticWebDoctorRuntime } from './runtime/agent-runtime.js';

const rt = new AgenticWebDoctorRuntime();
let lastScaffold = null;

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setNodeActive(agentName) {
  document.querySelectorAll('.agent-node').forEach((el) => {
    el.classList.toggle('active', el.dataset.agent === agentName);
  });
}

function appendChat(role, text) {
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.textContent = text;
  $('chat-log').appendChild(div);
  $('chat-log').scrollTop = $('chat-log').scrollHeight;
}

function renderAuditResult(title, conformance, security) {
  const safeTitle = escapeHtml(title);
  const stageClass = conformance.stageOnePass ? 'PASS' : 'FAIL';
  const secClass = security.posture === 'SAFE' ? 'PASS' : security.posture === 'REVIEW' ? 'WARN' : 'FAIL';
  const safePosture = escapeHtml(security.posture);
  const safeScore = Number.isFinite(conformance.score) ? conformance.score : 0;

  const html = `
    <div class="score-banner">
      <div>
        <strong>${safeTitle}</strong><br/>
        <span class="muted">Stage One: <strong class="status-${stageClass}">${stageClass}</strong> · Security Gate: <strong class="status-${secClass}">${safePosture}</strong></span>
      </div>
      <div class="score-big">${safeScore}/100</div>
    </div>
    <div>
      ${conformance.checks.map((c) => `
        <div class="check-item">
          <span>${c.passed ? '✅' : '❌'} <strong>${escapeHtml(c.label)}</strong> — <span class="muted">${escapeHtml(c.detail)}</span></span>
          <span>${c.passed ? Number(c.weight) || 0 : 0}/${Number(c.weight) || 0}</span>
        </div>
      `).join('')}
    </div>
    <h3 style="margin:12px 0 6px;font-size:0.86rem;">🛡️ Security Gate Findings</h3>
    <div>
      ${security.findings.map((f) => {
        const level = ['PASS', 'WARN', 'FAIL'].includes(f.level) ? f.level : 'WARN';
        return `
        <div class="check-item">
          <span><span class="status-${level}">[${level}]</span> <strong>${escapeHtml(f.title)}</strong> — <span class="muted">${escapeHtml(f.detail)}</span></span>
        </div>
      `;
      }).join('')}
    </div>
  `;
  $('audit-results').innerHTML = html;
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function updateBadge() {
  const b = $('runtime-badge');
  if (rt.byokConfig.mode === 'byok' && rt.byokConfig.apiKey) {
    b.textContent = `☁️ BYOK: ${rt.byokConfig.model}`;
    b.className = 'badge badge-byok';
  } else {
    b.textContent = '⚡ Local Runtime';
    b.className = 'badge badge-local';
  }
}

async function runSelfAudit() {
  const conformance = rt.auditConformance(rt.manifest, rt.network);
  const security = rt.inspectSecurityGate(rt.manifest, rt.network);
  renderAuditResult('Self-Audit: Agentic Web Doctor (This Site)', conformance, security);
}

async function bootstrap() {
  rt.onAgentTrace = ({ agentName, status, detail }) => {
    setNodeActive(status === 'running' ? agentName : '');
    $('trace-bar').textContent = `[${agentName}] ${status.toUpperCase()} — ${detail}`;
  };

  await rt.init();
  updateBadge();

  // 載入範例查詢按鈕
  const queries = rt.manifest?.networks?.[0]?.sample_queries || [];
  const sqWrap = $('sample-queries');
  queries.forEach((q) => {
    const btn = document.createElement('button');
    btn.className = 'sample-chip';
    btn.textContent = q;
    btn.onclick = () => sendChat(q);
    sqWrap.appendChild(btn);
  });

  appendChat('agent', '👋 Welcome to Agentic Web Doctor (MVP Profile 0.3). Click a sample query above, run a Self-Audit, or configure BYOK to chat with your own LLM router.');
  await runSelfAudit();

  // Tabs
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      $(`tab-${tab.dataset.tab}`).classList.add('active');
    };
  });

  $('btn-self-audit').onclick = async () => {
    document.querySelector('.tab[data-tab="auditor"]').click();
    await runSelfAudit();
  };

  $('btn-audit-url').onclick = async () => {
    const url = $('audit-url').value.trim();
    if (!url) return runSelfAudit();
    $('audit-results').innerHTML = `<p class="muted">Fetching CORS manifest from ${escapeHtml(url)}...</p>`;
    try {
      const res = await rt.auditRemoteUrl(url);
      renderAuditResult(`Remote Audit: ${res.manifestUrl}`, res.conformance, res.security);
    } catch (e) {
      $('audit-results').innerHTML = `<p class="status-FAIL">⚠️ Could not fetch remote manifest: ${escapeHtml(e.message)}. Ensure the target site serves CORS headers.</p>`;
    }
  };

  $('btn-audit-pizza').onclick = async () => {
    const officialUrl = 'https://raw.githubusercontent.com/cognizant-ai-labs/agentic-web/main/examples/pizza_restaurant_agentified/agent-manifest.json';
    $('audit-url').value = officialUrl;
    $('audit-results').innerHTML = `<p class="muted">Auditing Cognizant official example (Little Oven Pizza)...</p>`;
    try {
      const res = await rt.auditRemoteUrl(officialUrl);
      renderAuditResult('Official Example: Little Oven Pizza Assistant', res.conformance, res.security);
    } catch (e) {
      $('audit-results').innerHTML = `<p class="status-FAIL">⚠️ Failed to fetch official example: ${escapeHtml(e.message)}</p>`;
    }
  };

  $('btn-audit-paste').onclick = () => {
    const raw = $('paste-manifest').value.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const conformance = rt.auditConformance(parsed, null);
      const security = rt.inspectSecurityGate(parsed, null);
      renderAuditResult('Offline Audit: Pasted agent-manifest.json', conformance, security);
    } catch (e) {
      $('audit-results').innerHTML = `<p class="status-FAIL">⚠️ Invalid JSON: ${escapeHtml(e.message)}</p>`;
    }
  };

  $('btn-gen-scaffold').onclick = () => {
    const brand = $('scaf-brand').value.trim() || 'My Agentic Site';
    const type = $('scaf-type').value;
    lastScaffold = rt.generateScaffold(brand, type);
    $('scaffold-preview').textContent = JSON.stringify(lastScaffold.manifest, null, 2);
    $('btn-dl-manifest').disabled = false;
    $('btn-dl-network').disabled = false;
  };

  $('btn-dl-manifest').onclick = () => lastScaffold && downloadJson('agent-manifest.json', lastScaffold.manifest);
  $('btn-dl-network').onclick = () => lastScaffold && downloadJson(`${lastScaffold.slug}_assistant.network.json`, lastScaffold.network);

  // BYOK Modal
  $('btn-byok').onclick = () => {
    $('byok-mode').value = rt.byokConfig.mode;
    $('byok-url').value = rt.byokConfig.baseUrl;
    $('byok-model').value = rt.byokConfig.model;
    $('byok-key').value = rt.byokConfig.apiKey;
    $('byok-modal').classList.remove('hidden');
  };
  $('btn-close-modal').onclick = () => $('byok-modal').classList.add('hidden');
  $('btn-save-byok').onclick = () => {
    rt.saveByokConfig({
      mode: $('byok-mode').value,
      baseUrl: $('byok-url').value.trim(),
      model: $('byok-model').value.trim(),
      apiKey: $('byok-key').value.trim(),
    });
    updateBadge();
    $('byok-modal').classList.add('hidden');
  };
  $('btn-clear-byok').onclick = () => {
    rt.saveByokConfig({ mode: 'local', apiKey: '' });
    $('byok-key').value = '';
    $('byok-mode').value = 'local';
    updateBadge();
  };

  $('chat-form').onsubmit = async (e) => {
    e.preventDefault();
    const val = $('chat-input').value.trim();
    if (!val) return;
    $('chat-input').value = '';
    await sendChat(val);
  };
}

async function sendChat(msg) {
  appendChat('user', msg);
  const reply = await rt.chat(msg);
  appendChat('agent', reply.text);
}

bootstrap();
