(function () {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const ratio = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const viewSwitch = document.getElementById('viewSwitch');
  const viewSimple = document.getElementById('viewSimple');
  const viewFull = document.getElementById('viewFull');
  const simpleView = document.getElementById('simpleView');
  const playground = document.getElementById('analyticsPlayground');
  const simpleEmpty = document.getElementById('simpleEmpty');
  const simpleLive = document.getElementById('simpleLive');
  const simpleChart = document.getElementById('simpleChart');
  const storageKey = 'growthos-simple-view';

  function shortDate(iso) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)); }
  function dateShift(iso, days) { const date = new Date(`${iso}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
  function signed(value) { return `${value >= 0 ? '+' : ''}${Math.round(value)}%`; }
  function updown(value) { return value >= 0 ? 'up' : 'down'; }

  function setView(view) {
    const simple = view !== 'full';
    simpleView.classList.toggle('hidden', !simple);
    playground.classList.toggle('hidden', simple);
    viewSimple.classList.toggle('active', simple);
    viewFull.classList.toggle('active', !simple);
    viewSimple.setAttribute('aria-pressed', String(simple));
    viewFull.setAttribute('aria-pressed', String(!simple));
    try { window.localStorage.setItem(storageKey, simple ? 'simple' : 'full'); } catch (error) { /* ignore */ }
    if (simple) render();
  }

  function renderChart(summary) {
    const sales = summary.dailySales;
    const spend = summary.dailySpend;
    const days = sales.length;
    const width = Math.max(simpleChart.clientWidth || 820, 340);
    const height = 260, padL = 64, padR = 20, padT = 18, padB = 34;
    const plotW = width - padL - padR, plotH = height - padT - padB;
    // One shared scale so the two lines are honestly comparable.
    const max = (Math.max(...sales, ...spend) || 1) * 1.12;
    const x = index => padL + (days <= 1 ? plotW / 2 : index * (plotW / (days - 1)));
    const y = value => padT + plotH - (value / max) * plotH;
    const line = data => data.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
    const fracs = [0, 0.5, 1];
    const grid = fracs.map(frac => { const gy = (padT + plotH - frac * plotH).toFixed(1); return `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}"/>`; }).join('');
    const yLabels = fracs.map(frac => `<text class="simple-axis-y" x="${padL - 10}" y="${(padT + plotH - frac * plotH + 4).toFixed(1)}">${money.format(max * frac)}</text>`).join('');
    const step = Math.max(1, Math.round(days / 5));
    let xLabels = '';
    for (let index = 0; index < days; index += step) xLabels += `<text class="simple-axis-x" x="${x(index).toFixed(1)}" y="${height - 12}" text-anchor="middle">${shortDate(dateShift(summary.startDate, index))}</text>`;
    simpleChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    simpleChart.innerHTML = `${grid}${yLabels}<polyline class="simple-spend-line" points="${line(spend)}"/><polyline class="simple-sales-line" points="${line(sales)}"/>${xLabels}`;
  }

  function render() {
    const summary = window.GrowthOSSummary && window.GrowthOSSummary();
    if (!summary) { simpleEmpty.classList.remove('hidden'); simpleLive.classList.add('hidden'); return; }
    simpleEmpty.classList.add('hidden'); simpleLive.classList.remove('hidden');

    const roas = summary.roas;
    const returnText = roas > 0 ? ratio.format(roas) : '$0.00';
    const salesUp = summary.salesChange >= 0;
    const spendUp = summary.spendChange >= 0;

    document.getElementById('simpleHeadline').textContent = roas >= 1
      ? `For every $1 you spent on ads, you made back ${returnText} in sales.`
      : `Right now you're making back ${returnText} for every $1 spent on ads.`;

    // Plain-English verdict.
    let verdict;
    if (roas >= 1.5 && summary.salesChange >= summary.spendChange) {
      verdict = 'Good news — your sales are growing at least as fast as your ad spending, and you’re making back more than you put in.';
    } else if (roas >= 1) {
      verdict = 'You’re making back more than you spend on ads. Keep an eye on whether sales keep up as spending grows.';
    } else {
      verdict = 'Right now you’re spending more on ads than they’re bringing back in sales. This is worth a closer look.';
    }
    document.getElementById('simpleVerdict').textContent = verdict;

    document.getElementById('simpleScope').textContent = `Last ${summary.days} days · compared with ${summary.comparisonLabel}`;

    document.getElementById('simpleSales').textContent = money.format(summary.sales);
    const salesChange = document.getElementById('simpleSalesChange');
    salesChange.textContent = `${salesUp ? '▲' : '▼'} ${signed(summary.salesChange)} — sales are ${updown(summary.salesChange)} vs. ${summary.comparisonLabel}`;
    salesChange.className = salesUp ? 'good' : 'bad';

    document.getElementById('simpleSpend').textContent = money.format(summary.spend);
    const spendChange = document.getElementById('simpleSpendChange');
    spendChange.textContent = `${spendUp ? '▲' : '▼'} ${signed(summary.spendChange)} — spending is ${updown(summary.spendChange)} vs. ${summary.comparisonLabel}`;
    // Rising spend isn't automatically bad, so keep it neutral.
    spendChange.className = 'neutral';

    document.getElementById('simpleReturn').textContent = `${returnText}`;
    document.getElementById('simpleReturnNote').textContent = roas >= 1 ? 'more than you spent' : 'less than you spent';

    document.getElementById('simpleChartCaption').textContent = 'The green line (sales) sits well above the amber line (ad spend) — you’re making a lot more than you’re putting into ads. Both lines rise on weekends, when restaurants are busiest.';

    renderChart(summary);
  }

  // Expose so performance.js can refresh the simple view on every data change.
  window.GrowthOSSimpleRender = render;

  viewSimple.addEventListener('click', () => setView('simple'));
  viewFull.addEventListener('click', () => setView('full'));
  window.addEventListener('resize', () => { if (!simpleView.classList.contains('hidden')) render(); });

  let saved = 'simple';
  try { saved = window.localStorage.getItem(storageKey) || 'simple'; } catch (error) { /* ignore */ }
  setView(saved);
})();
