(function initialiseWorkflows() {
  const storageKey = 'growthos:custom-workflows';
  const suggested = [
    { id: 'meta-tiktok-cpa', title: 'Shift Meta prospecting to TikTok', subtitle: 'Ideal to improve new-guest transactions', window: 'Last 7 days', trigger: 'Meta prospecting CPA is at least 20% above target with at least $1,500 in spend.', source: ['meta'], destination: ['tiktok'], amount: 'Reduce only the affected top-of-funnel budget; start TikTok at its minimum viable daily budget.', protect: 'Keep Meta retargeting fully funded: 180-day site visitors, cart abandoners, and add-to-cart audiences.', setup: 'TikTok Spark Ads · 15-day engagement audience · interest and behavior layering · exclude 30-day purchasers.', reset: 'Return budget when Meta CPA is back within target for the following trailing window.', status: 'Needs CPA target' },
    { id: 'roas-ranking', title: 'Rotate budget to the strongest blended ROAS', subtitle: 'Ideal to grow contribution-efficient sales', window: 'Every Monday · last 7 days', trigger: 'Rank Meta, TikTok, and Google by blended ROAS; identify the lowest and highest channel.', source: ['meta', 'tiktok', 'google'], destination: ['meta', 'tiktok', 'google'], amount: 'Move 10–15% of total budget from the lowest-ranked channel to the highest; cap each platform at ±20% week over week.', protect: 'Protect high-intent and retargeting activity on the source channel before moving any prospecting dollars.', setup: 'Meta: Advantage+ Shopping or broad · TikTok: Smart+ · Google: Performance Max with Customer Match and in-market signals.', reset: 'Re-rank next Monday; reverse a move when the channel ordering changes.', status: 'Ready to configure' },
    { id: 'retargeting-saturation', title: 'Relieve Meta retargeting saturation', subtitle: 'Ideal to improve repeat transactions', window: 'Last 7 days', trigger: 'A Meta retargeting ad set reaches frequency above 6, or its audience falls below the chosen reach floor.', source: ['meta'], destination: ['tiktok', 'google'], amount: 'Reduce only the saturated Meta retargeting ad set and preserve Meta prospecting.', protect: 'No changes outside the individual saturated retargeting layer.', setup: 'TikTok: last-14-day ViewContent/AddToCart audience · Google: RLSA on high-intent search plus YouTube remarketing.', reset: 'Restore Meta budget once frequency and reach normalize for a full trailing window.', status: 'Needs reach floor' },
    { id: 'demand-capture', title: 'Capture a demand spike in Google Search', subtitle: 'Ideal to grow sales from high-intent demand', window: 'Daily check · 7-day context', trigger: 'Organic sessions rise at least 30% day over day, or branded search volume spikes after a launch, promo, or press mention.', source: ['meta', 'tiktok'], destination: ['google'], amount: 'Temporarily trim paid-social prospecting by the chosen percentage for the duration of the demand spike.', protect: 'Do not trim Meta or TikTok retargeting layers.', setup: 'Fund exact-match branded search first, then non-branded Target ROAS search and an isolated high-intent Performance Max asset group.', reset: 'Restore paid-social prospecting after the demand signal returns to baseline.', status: 'Needs baseline' },
    { id: 'delivery-shift', title: 'Move paid-social budget into delivery marketplaces', subtitle: 'Ideal to grow marketplace payouts', window: 'Last 14 days', trigger: 'Combined Meta and TikTok spend exceeds $4,000 during the trailing window.', source: ['meta', 'tiktok'], destination: ['doordash', 'ubereats'], amount: 'Shift $2,000 total, allocated by historical DoorDash and Uber Eats order share.', protect: 'Reduce prospecting only; retain paid-social retargeting and high-intent layers.', setup: 'DoorDash and Uber Eats: separate new-customer and lapsed-customer campaigns; lunch and dinner dayparts; platform-specific offers.', reset: 'Revert when social spend falls below $4,000 or blended delivery CAC exceeds your configured ceiling.', status: 'Needs CAC ceiling' }
  ];
  const providerNames = { meta: 'Meta', tiktok: 'TikTok', google: 'Google', doordash: 'DoorDash', ubereats: 'Uber Eats' };
  const providerLogos = { meta: 'https://cdn.simpleicons.org/meta/0866FF', tiktok: 'https://cdn.simpleicons.org/tiktok/EE1D52', google: 'https://cdn.simpleicons.org/google/4285F4', doordash: 'https://cdn.simpleicons.org/doordash/FF3008', ubereats: 'https://cdn.simpleicons.org/ubereats/06C167' };
  const blockInfo = { trigger: ['◉', 'Trigger'], source: ['−', 'Source budget'], allocation: ['⇄', 'Allocation'], destination: ['+', 'Destination'], review: ['✓', 'Human review'], reset: ['↺', 'Reset'] };
  const picker = document.getElementById('workflowPickerList');
  const panel = document.getElementById('workflowCanvasPanel');
  const customList = document.getElementById('customWorkflowList');
  const customEmpty = document.getElementById('customWorkflowEmpty');
  const modal = document.getElementById('workflowModal');
  const form = document.getElementById('customWorkflowForm');
  const dropCanvas = document.getElementById('workflowDropCanvas');
  let selectedId = suggested[0].id;
  let builderBlocks = [];

  const esc = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const saved = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; } };
  const store = items => localStorage.setItem(storageKey, JSON.stringify(items));
  const getItems = () => [...suggested, ...saved()];
  const current = () => getItems().find(item => item.id === selectedId) || suggested[0];
  const logos = ids => ids.map(id => `<span class="workflow-provider"><img src="${providerLogos[id]}" alt="${providerNames[id]}" /><b>${providerNames[id]}</b></span>`).join('');

  function diagram(item) {
    const blocks = [
      ['trigger', 'When', item.trigger],
      ['source', 'Reduce from', logos(item.source)],
      ['allocation', 'Proposed move', item.amount],
      ['destination', 'Route to', logos(item.destination)],
      ['review', 'Approval', 'Highest-sales channel owner'],
      ['reset', 'Reset', item.reset]
    ];
    return `<div class="workflow-block-diagram" aria-label="Workflow block diagram">${blocks.map(([type, label, content], index) => `<div class="workflow-visual-block ${type}"><span><b>${blockInfo[type][0]}</b>${label}</span><strong>${content}</strong></div>${index < blocks.length - 1 ? '<i class="workflow-block-arrow" aria-hidden="true">→</i>' : ''}`).join('')}</div>`;
  }
  function renderPicker() {
    const items = getItems();
    picker.innerHTML = `<span class="workflow-picker-label">SUGGESTED</span>${items.filter(item => !item.suggestedId && !item.id.startsWith('custom-')).map(item => `<button type="button" class="workflow-pick ${item.id === selectedId ? 'active' : ''}" data-workflow-pick="${item.id}"><span>${item.status.includes('Needs') ? '!' : '✓'}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.subtitle)}</small></div><b>›</b></button>`).join('')}<span class="workflow-picker-label workflow-picker-label-custom">YOUR DRAFTS</span>${items.filter(item => item.suggestedId || item.id.startsWith('custom-')).map(item => `<button type="button" class="workflow-pick ${item.id === selectedId ? 'active' : ''}" data-workflow-pick="${item.id}"><span>◇</span><div><strong>${esc(item.title)}</strong><small>${esc(item.subtitle || 'Custom workflow draft')}</small></div><b>›</b></button>`).join('') || '<p class="workflow-picker-empty">No custom drafts yet.</p>'}`;
    picker.querySelectorAll('[data-workflow-pick]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.workflowPick; render(); }));
  }
  function renderPanel() {
    const item = current();
    const isCustom = item.id.startsWith('custom-') || Boolean(item.suggestedId);
    panel.innerHTML = `<div class="workflow-canvas-head"><div><span class="eyebrow">${isCustom ? 'CUSTOM WORKFLOW' : 'SUGGESTED PLAYBOOK'}</span><h3>${esc(item.title)}</h3><p>${esc(item.subtitle || 'Designed around your selected business outcome')}</p></div><span class="workflow-status ${item.status.includes('Needs') ? 'workflow-status-warning' : ''}">${esc(item.status)}</span></div><div class="workflow-canvas-meta"><span><b>OUTCOME</b>${esc(item.subtitle || 'Custom outcome')}</span><span><b>WINDOW</b>${esc(item.window)}</span><span><b>MODE</b>Advisory · review required</span></div>${diagram(item)}<div class="workflow-explainer"><div><span>PROTECTED LAYERS</span><p>${esc(item.protect || 'Source high-intent and retargeting layers remain protected unless an authorized reviewer approves an exception.')}</p></div><div><span>DESTINATION SETUP</span><p>${esc(item.setup || 'Use the delivery configuration agreed during review.')}</p></div></div><footer class="workflow-canvas-footer"><span><b>Review route:</b> ${esc(item.reviewer || 'Highest-sales channel owner')}</span>${isCustom ? `<button type="button" class="workflow-delete" data-delete-workflow="${item.id}">Remove draft</button>` : `<button type="button" class="workflow-draft" data-suggested-workflow="${item.id}">Add to drafts <b>→</b></button>`}</footer>`;
    panel.querySelector('[data-delete-workflow]')?.addEventListener('click', event => { store(saved().filter(item => item.id !== event.currentTarget.dataset.deleteWorkflow)); selectedId = suggested[0].id; render(); });
    panel.querySelector('[data-suggested-workflow]')?.addEventListener('click', event => {
      const source = suggested.find(item => item.id === event.currentTarget.dataset.suggestedWorkflow);
      const items = saved();
      const id = `suggested-${source.id}`;
      if (!items.some(item => item.id === id)) items.push({ ...source, id, suggestedId: source.id, status: 'Draft · review required', reviewer: 'Set reviewer in Operating context' });
      store(items); selectedId = id; render();
    });
  }
  function renderCustomList() {
    const custom = saved();
    customList.innerHTML = custom.map(item => `<button type="button" class="custom-workflow-row" data-workflow-pick="${item.id}"><span>◇</span><div><strong>${esc(item.title)}</strong><small>${esc(item.subtitle || 'Custom workflow draft')} · ${esc(item.window)}</small></div><b>Open →</b></button>`).join('');
    customList.classList.toggle('hidden', custom.length === 0);
    customEmpty.classList.toggle('hidden', custom.length > 0);
    document.getElementById('activeWorkflowCount').textContent = custom.length;
    customList.querySelectorAll('[data-workflow-pick]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.workflowPick; render(); document.querySelector('.workflow-studio').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }
  function render() { renderPicker(); renderPanel(); renderCustomList(); }

  function renderBuilder() {
    dropCanvas.innerHTML = builderBlocks.length ? builderBlocks.map((type, index) => `<div class="builder-block ${type}"><span><b>${blockInfo[type][0]}</b>${blockInfo[type][1]}</span><button type="button" aria-label="Remove ${blockInfo[type][1]}" data-remove-builder-block="${index}">×</button></div>${index < builderBlocks.length - 1 ? '<i>→</i>' : ''}`).join('') : '<div class="workflow-drop-placeholder"><span>Drop decision blocks here</span><small>Start with a trigger, then connect the budget move.</small></div>';
    dropCanvas.querySelectorAll('[data-remove-builder-block]').forEach(button => button.addEventListener('click', () => { builderBlocks.splice(Number(button.dataset.removeBuilderBlock), 1); renderBuilder(); }));
  }
  function addBuilderBlock(type) { if (!blockInfo[type]) return; builderBlocks.push(type); renderBuilder(); }
  function openModal() { modal.classList.remove('hidden'); document.body.classList.add('workflow-modal-open'); builderBlocks = ['trigger', 'source', 'allocation', 'destination', 'review', 'reset']; renderBuilder(); form.elements.name.focus(); }
  function closeModal() { modal.classList.add('hidden'); document.body.classList.remove('workflow-modal-open'); form.reset(); builderBlocks = []; document.getElementById('workflowFormStatus').textContent = ''; }
  ['openCustomWorkflow', 'openCustomWorkflowSecondary', 'openCustomWorkflowEmpty', 'openCustomWorkflowEmptySecondary'].forEach(id => document.getElementById(id)?.addEventListener('click', openModal));
  document.getElementById('closeWorkflowModal').addEventListener('click', closeModal);
  document.getElementById('cancelCustomWorkflow').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
  document.querySelectorAll('[data-workflow-block]').forEach(button => {
    button.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', button.dataset.workflowBlock); event.dataTransfer.effectAllowed = 'copy'; });
    button.addEventListener('click', () => addBuilderBlock(button.dataset.workflowBlock));
  });
  dropCanvas.addEventListener('dragover', event => { event.preventDefault(); dropCanvas.classList.add('drag-over'); });
  dropCanvas.addEventListener('dragleave', () => dropCanvas.classList.remove('drag-over'));
  dropCanvas.addEventListener('drop', event => { event.preventDefault(); dropCanvas.classList.remove('drag-over'); addBuilderBlock(event.dataTransfer.getData('text/plain')); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const source = data.getAll('sources');
    const destination = data.getAll('destinations');
    const status = document.getElementById('workflowFormStatus');
    if (!source.length || !destination.length) { status.textContent = 'Choose at least one source and one destination.'; return; }
    if (!builderBlocks.includes('trigger') || !builderBlocks.includes('destination')) { status.textContent = 'Add at least a trigger and destination block to the canvas.'; return; }
    const workflow = { id: `custom-${Date.now()}`, title: data.get('name').trim(), subtitle: `Ideal to ${String(data.get('outcome')).toLowerCase()}`, window: `Last ${data.get('window')} days`, trigger: data.get('trigger').trim(), source, destination, amount: data.get('amount').trim(), reviewer: data.get('reviewer').trim(), protect: 'Source high-intent and retargeting layers remain protected unless the reviewer explicitly approves an exception.', setup: 'Use the destination configuration and placement logic agreed during review.', reset: data.get('reset').trim(), status: 'Draft · review required', blocks: builderBlocks };
    store([...saved(), workflow]); selectedId = workflow.id; render(); closeModal();
  });
  render();
}());
