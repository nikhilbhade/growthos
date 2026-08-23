const setupPanel = document.getElementById('connections');
const closeSetup = document.getElementById('closeSetup');

function openSetup(provider) {
  if (provider && typeof window.openProviderSetup === 'function') {
    window.openProviderSetup(provider);
    return;
  }
  setupPanel.classList.remove('hidden');
  document.body.classList.add('setup-open');
  closeSetup.focus();
}

function closeSetupPanel() {
  setupPanel.classList.add('hidden');
  document.body.classList.remove('setup-open');
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-open-setup]');
  if (!trigger) return;
  event.preventDefault();
  openSetup(trigger.dataset.provider);
});

closeSetup.addEventListener('click', closeSetupPanel);
setupPanel.addEventListener('click', event => { if (event.target === setupPanel) closeSetupPanel(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSetupPanel(); });

window.openSetupWorkspace = openSetup;

fetch(`/api/integrations${window.growthOSDemo?.query() || ''}`).then(response => response.json()).then(integrations => {
  const connected = integrations.filter(integration => integration.status === 'connected').length;
  document.getElementById('setupProgress').textContent = `${connected} of ${integrations.length} sources ready`;
  if (connected > 0) document.getElementById('setupDescription').textContent = 'Manage providers and validation from this one setup workspace.';
});
