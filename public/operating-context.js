(function initialiseOperatingContext() {
  const storageKey = 'growthos:operating-context';
  const defaults = {
    growth: 12,
    spendShift: 15,
    objective: 'profitable-growth',
    cogs: 28,
    labor: 22,
    commission: 18,
    capacity: 70,
    notes: ''
  };
  const fields = {
    growth: document.getElementById('contextGrowth'),
    spendShift: document.getElementById('contextSpendShift'),
    objective: document.getElementById('contextObjective'),
    cogs: document.getElementById('contextCogs'),
    labor: document.getElementById('contextLabor'),
    commission: document.getElementById('contextCommission'),
    capacity: document.getElementById('contextCapacityInput'),
    notes: document.getElementById('contextNotes')
  };

  if (!Object.values(fields).every(Boolean)) return;

  const values = () => Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.type === 'select-one' || input.tagName === 'TEXTAREA' ? input.value : Number(input.value)]));
  const setValue = (id, value) => { const target = document.getElementById(id); if (target) target.textContent = `${value}%`; };

  function render() {
    const state = values();
    setValue('contextGrowthValue', state.growth);
    setValue('contextSpendShiftValue', state.spendShift);
    setValue('contextCogsValue', state.cogs);
    setValue('contextLaborValue', state.labor);
    setValue('contextCommissionValue', state.commission);
    setValue('contextCapacityValue', state.capacity);

    const contribution = Math.max(0, 100 - state.cogs - state.labor - state.commission);
    const contributionNode = document.getElementById('contextContribution');
    const capacityNode = document.getElementById('contextCapacity');
    const summaryNode = document.getElementById('contextSummaryCopy');
    if (contributionNode) contributionNode.textContent = `${contribution}%`;
    if (capacityNode) capacityNode.textContent = `${state.capacity}%`;
    if (summaryNode) {
      const capacityMessage = state.capacity < 35
        ? 'Capacity is constrained. GrowthOS will treat incremental demand as operationally limited until this changes.'
        : 'GrowthOS will use these inputs as global defaults, then allow location-level refinements once operating data is available.';
      summaryNode.textContent = `${contribution}% of sales remains before marketing at these assumptions. ${capacityMessage}`;
    }
  }

  function restore() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      const state = { ...defaults, ...(stored && typeof stored === 'object' ? stored : {}) };
      Object.entries(fields).forEach(([key, input]) => { input.value = state[key]; });
    } catch (_) {
      Object.entries(fields).forEach(([key, input]) => { input.value = defaults[key]; });
    }
    render();
  }

  Object.values(fields).forEach(input => input.addEventListener('input', render));
  Object.values(fields).forEach(input => input.addEventListener('change', render));

  document.getElementById('saveContext')?.addEventListener('click', () => {
    const status = document.getElementById('contextSaveStatus');
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values()));
      status.textContent = 'Saved to this browser · ready to apply when your workspace is connected';
    } catch (_) {
      status.textContent = 'Changes are ready for this session. Connect a workspace to save them permanently.';
    }
  });

  restore();
}());
