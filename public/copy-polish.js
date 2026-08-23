(() => {
  const replacements = new Map([
    ['Waiting for first provider sync', 'Data connection required'],
    ['ANALYTICS PLAYGROUND', 'ANALYTICS WORKSPACE'],
    ['Demo market snapshot · Updated today', 'Preview market view · Updated today'],
    ['Demo market snapshot · Directional only', 'Preview market view · Directional only'],
    ['Demo data · complete through Aug 19', 'Preview data · complete through Aug 19'],
    ['Demo records are illustrative. Connect the provider to retrieve your account’s actual objects and reporting windows.', 'Preview data is shown until this provider is connected. Once connected, this workspace uses your account structure and reporting windows.'],
    ['Demo values below are illustrative and are not customer-level reporting.', 'Preview values are directional and do not represent customer-level reporting.'],
    ['Demo data', 'Preview data'],
    ['Demo values are illustrative.', 'Preview values are directional.'],
    ['Read-only MVP', 'Read-only access'],
    ['Pending provider connections', 'Provider access required'],
    ['Local visibility is waiting for a data source.', 'Local visibility needs a connected data source.'],
    ['Pricing intelligence is waiting for a data source.', 'Pricing intelligence needs a connected data source.'],
    ['Variance explanation is waiting for data.', 'Variance explanation needs connected data.']
  ]);

  function polish(value) {
    let next = value;
    replacements.forEach((replacement, source) => { next = next.replaceAll(source, replacement); });
    return next
      .replace(/Synthetic demo data only/g, 'Preview data')
      .replace(/Synthetic demo data/g, 'Preview data')
      .replace(/demo data/gi, 'preview data')
      .replace(/demo stores/gi, 'preview locations');
  }

  function polishNode(node) {
    if (node.nodeType === Node.TEXT_NODE) node.nodeValue = polish(node.nodeValue || '');
    else node.childNodes.forEach(polishNode);
  }

  polishNode(document.body);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(polishNode)))
    .observe(document.body, { childList: true, subtree: true });
})();
