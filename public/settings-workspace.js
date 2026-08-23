(function () {
  const workspace = document.getElementById('settingsWorkspace');
  if (!workspace) return;

  // Sub-nav tab switching
  const tabs = Array.from(workspace.querySelectorAll('.set-tab[data-tab]'));
  const panels = Array.from(workspace.querySelectorAll('.set-panel'));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { const on = t === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  }));

  // ---- User access management ----
  const STORE = 'growthos:user-access';
  const FEATURES = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'emails', label: 'Emails' },
    { id: 'reports', label: 'Reports' },
    { id: 'workflows', label: 'Workflows' }
  ];
  const seed = [
    { id: 'u-priya', name: 'Priya Shah', email: 'priya@littlelemon.com', role: 'Head of Marketing', features: { notifications: true, emails: true, reports: true, workflows: true } },
    { id: 'u-marco', name: 'Marco Alvarez', email: 'marco@littlelemon.com', role: 'Growth Analyst', features: { notifications: true, emails: true, reports: true, workflows: false } },
    { id: 'u-dana', name: 'Dana Reyes', email: 'dana@littlelemon.com', role: 'Finance', features: { notifications: false, emails: true, reports: true, workflows: false } }
  ];

  const table = document.getElementById('accessTable');
  const countEl = document.getElementById('accessCount');
  const form = document.getElementById('accessInvite');
  if (!table || !form) return;

  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || '?';

  function normalize(u) {
    const features = {};
    FEATURES.forEach(f => { features[f.id] = Boolean(u.features && u.features[f.id]); });
    return { id: u.id || `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: u.name || 'Unnamed', email: u.email || '', role: u.role || '', features };
  }
  function load() {
    try { const raw = localStorage.getItem(STORE); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p.map(normalize); } } catch { /* ignore */ }
    return seed.map(normalize);
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(users)); } catch { /* ignore */ } }

  let users = load();

  function render() {
    const header = `<div class="access-row access-head" role="row"><span class="access-user-col" role="columnheader">User</span>${FEATURES.map(f => `<span role="columnheader">${f.label}</span>`).join('')}<span role="columnheader" aria-label="Remove"></span></div>`;
    const rows = users.map(u => {
      const meta = [u.role, u.email].filter(Boolean).map(esc).join(' · ');
      const toggles = FEATURES.map(f => `<label class="access-toggle" role="cell"><input type="checkbox" data-user="${u.id}" data-feature="${f.id}" ${u.features[f.id] ? 'checked' : ''} aria-label="${f.label} for ${esc(u.name)}" /><span class="access-check" aria-hidden="true"></span></label>`).join('');
      return `<div class="access-row" role="row"><div class="access-user" role="cell"><span class="access-avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="access-user-text"><strong>${esc(u.name)}</strong><small>${meta || '&nbsp;'}</small></span></div>${toggles}<button type="button" class="access-remove" data-remove="${u.id}" aria-label="Remove ${esc(u.name)}">×</button></div>`;
    }).join('');
    table.innerHTML = header + (users.length ? rows : '<div class="access-empty">No users yet. Add a teammate above.</div>');
    if (countEl) countEl.textContent = `${users.length} user${users.length === 1 ? '' : 's'}`;
  }

  table.addEventListener('change', e => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    const u = users.find(x => x.id === input.dataset.user);
    if (!u) return;
    u.features[input.dataset.feature] = input.checked;
    save();
  });
  table.addEventListener('click', e => {
    const btn = e.target.closest('button[data-remove]');
    if (!btn) return;
    users = users.filter(u => u.id !== btn.dataset.remove);
    save(); render();
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const role = String(data.get('role') || '').trim();
    if (!name || !email) return;
    users.push(normalize({ name, email, role, features: { notifications: true, emails: true, reports: true, workflows: false } }));
    save(); render(); form.reset();
    form.querySelector('input[name="name"]').focus();
  });

  render();
})();
