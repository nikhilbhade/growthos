(() => {
  const ids = [
    'locationFilter', 'marketplaceFilter', 'channelFilter',
    'rankingMarketplace', 'marketLocation', 'pricingMarketplace', 'pricingLocation',
    'retentionLocation', 'retentionChannel', 'varianceLocation', 'varianceSource'
  ];

  const optionValues = select => [...select.options].map(option => option.value);
  const selected = select => [...select.options].filter(option => option.selected).map(option => option.value);
  const allOption = select => select.querySelector('option[value="all"]');
  const concreteValues = select => selected(select).filter(value => value !== 'all');

  function selectionLabel(select) {
    const values = selected(select);
    const all = allOption(select);
    if (values.includes('all') || !values.length) return all?.textContent || 'All';
    if (values.length === 1) return select.querySelector(`option[value="${values[0]}"]`)?.textContent || '1 selected';
    return `${values.length} selected`;
  }

  function setValues(select, nextValues, emit = true) {
    const next = new Set(Array.isArray(nextValues) ? nextValues : [nextValues]);
    const valid = optionValues(select);
    const values = next.has('all') || !next.size ? ['all'] : [...next].filter(value => valid.includes(value) && value !== 'all');
    const resolved = values.length ? values : ['all'];
    [...select.options].forEach(option => { option.selected = resolved.includes(option.value); });
    select._growthOSMulti?.render();
    if (emit) select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function build(select) {
    if (!select || select._growthOSMulti) return;
    select.multiple = true;
    select.classList.add('multi-select-native');
    const wrapper = document.createElement('div');
    wrapper.className = 'multi-select';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'multi-select-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.className = 'multi-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-multiselectable', 'true');
    wrapper.append(button, menu);
    select.after(wrapper);

    const render = () => {
      const values = selected(select);
      button.textContent = selectionLabel(select);
      button.title = values.includes('all') ? selectionLabel(select) : values.map(value => select.querySelector(`option[value="${value}"]`)?.textContent).join(', ');
      menu.innerHTML = [...select.options].map(option => `<label class="multi-select-option ${option.value === 'all' ? 'all-option' : ''}"><input type="checkbox" value="${option.value}" ${option.selected ? 'checked' : ''} /><span>${option.textContent}</span></label>`).join('');
      button.disabled = select.disabled;
    };
    const close = () => { wrapper.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); };
    button.addEventListener('click', () => {
      const opening = !wrapper.classList.contains('open');
      document.querySelectorAll('.multi-select.open').forEach(item => item.classList.remove('open'));
      wrapper.classList.toggle('open', opening);
      button.setAttribute('aria-expanded', String(opening));
    });
    menu.addEventListener('change', event => {
      const input = event.target;
      if (!input.matches('input[type="checkbox"]')) return;
      const current = new Set(concreteValues(select));
      if (input.value === 'all') {
        setValues(select, 'all');
        return;
      }
      if (input.checked) current.add(input.value); else current.delete(input.value);
      setValues(select, current.size ? [...current] : 'all');
    });
    select._growthOSMulti = { render, close };
    render();
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.multi-select')) document.querySelectorAll('.multi-select.open').forEach(item => item.classList.remove('open'));
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.multi-select.open').forEach(item => item.classList.remove('open')); });
  ids.forEach(id => build(document.getElementById(id)));
  window.GrowthOSFilters = { values: concreteValues, isAll: select => selected(select).includes('all'), set: setValues, label: selectionLabel };
})();
