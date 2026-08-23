(function () {
  const nav = document.querySelector('#workflows .workflow-stage-nav');
  const stages = Array.from(document.querySelectorAll('#workflows .workflow-stage'));
  if (!nav || !stages.length) return;

  const tabs = Array.from(nav.querySelectorAll('.wf-stage-tab'));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { const on = t === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    stages.forEach(s => s.classList.toggle('hidden', s.dataset.wfPanel !== tab.dataset.wfStage));
  }));

  const reviewList = document.getElementById('wfReviewList');
  const deployList = document.getElementById('wfDeployList');
  const deployLog = document.getElementById('wfDeployLog');
  if (!reviewList || !deployList || !deployLog) return;

  const STORE = 'growthos:workflow-stages';
  const seed = {
    review: [
      { id: 'MOVE-114', title: 'Shift Meta prospecting to TikTok', trigger: 'Meta prospecting CPA +24% over target for 14 days', move: 'Move $1,200 / wk · Meta → TikTok', reviewer: 'Priya Shah' },
      { id: 'MOVE-115', title: 'Relieve Meta retargeting saturation', trigger: 'Retargeting frequency above 6 at River North', move: 'Move $500 / wk · Meta → Google', reviewer: 'Marco Alvarez' }
    ],
    deploy: [
      { id: 'MOVE-112', title: 'Capture demand spike in Google Search', move: 'Move $800 / wk · TikTok → Google', reviewer: 'Priya Shah', approvedAt: 'Aug 21' }
    ],
    log: [
      { id: 'MOVE-108', title: 'Rotate budget to strongest blended ROAS', reviewer: 'Priya Shah', deployedAt: 'Aug 12' }
    ]
  };

  function load() { try { const r = localStorage.getItem(STORE); if (r) return JSON.parse(r); } catch { /* ignore */ } return JSON.parse(JSON.stringify(seed)); }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* ignore */ } }
  let state = load();

  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  function render() {
    reviewList.innerHTML = state.review.length ? state.review.map(m => `
      <article class="wf-move" data-id="${m.id}">
        <div class="wf-move-main">
          <div class="wf-move-head"><span class="wf-move-id">${esc(m.id)}</span><span class="wf-move-route">${esc(m.move)}</span></div>
          <h4>${esc(m.title)}</h4>
          <p class="wf-move-trigger"><b>When</b> ${esc(m.trigger)}</p>
          <span class="wf-move-reviewer">Routed to ${esc(m.reviewer)}</span>
        </div>
        <div class="wf-move-actions">
          <button type="button" class="wf-move-btn approve" data-action="approve" data-id="${m.id}">Approve</button>
          <button type="button" class="wf-move-btn ghost" data-action="changes" data-id="${m.id}">Request changes</button>
        </div>
      </article>`).join('') : '<div class="wf-move-empty">Nothing awaiting review.</div>';

    deployList.innerHTML = state.deploy.length ? state.deploy.map(m => `
      <article class="wf-move" data-id="${m.id}">
        <div class="wf-move-main">
          <div class="wf-move-head"><span class="wf-move-id">${esc(m.id)}</span><span class="wf-move-badge">APPROVED${m.approvedAt ? ' · ' + esc(m.approvedAt) : ''}</span></div>
          <h4>${esc(m.title)}</h4>
          <p class="wf-move-trigger">${esc(m.move)}</p>
          <span class="wf-move-reviewer">Approved by ${esc(m.reviewer)}</span>
        </div>
        <div class="wf-move-actions">
          <button type="button" class="wf-move-btn deploy" data-action="deploy" data-id="${m.id}">Deploy</button>
        </div>
      </article>`).join('') : '<div class="wf-move-empty">No approved moves waiting to deploy.</div>';

    deployLog.innerHTML = state.log.length ? state.log.map(m => `
      <div class="wf-log-row"><span class="wf-log-dot"></span><div><strong>${esc(m.title)}</strong><small>${esc(m.id)} · deployed ${esc(m.deployedAt)} · ${esc(m.reviewer)}</small></div><span class="wf-log-tag">Deployed</span></div>`).join('') : '<div class="wf-move-empty">No deployments yet.</div>';

    setText('wfReviewCount', `${state.review.length} awaiting review`);
    setText('wfDeployCount', `${state.deploy.length} approved`);
    setText('wfReviewBadge', state.review.length);
    setText('wfDeployBadge', state.deploy.length);
    save();
  }

  function handle(action, id) {
    if (action === 'approve') {
      const i = state.review.findIndex(m => m.id === id); if (i === -1) return;
      const [m] = state.review.splice(i, 1); m.approvedAt = today(); state.deploy.push(m);
    } else if (action === 'changes') {
      state.review = state.review.filter(m => m.id !== id);
    } else if (action === 'deploy') {
      const i = state.deploy.findIndex(m => m.id === id); if (i === -1) return;
      const [m] = state.deploy.splice(i, 1); state.log.unshift({ id: m.id, title: m.title, reviewer: m.reviewer, deployedAt: today() });
    }
    render();
  }

  [reviewList, deployList].forEach(c => c.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]'); if (!btn) return; handle(btn.dataset.action, btn.dataset.id);
  }));

  render();
})();
