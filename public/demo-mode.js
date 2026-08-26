const demoToggle = document.getElementById('demoToggle');
const demoStorageKey = 'growthos-demo-mode';

// Allow a shareable ?demo=1 link to turn on preview data automatically.
if (new URLSearchParams(window.location.search).get('demo') === '1') {
  window.localStorage.setItem(demoStorageKey, 'true');
}

function isEnabled() {
  return window.localStorage.getItem(demoStorageKey) === 'true';
}

function applyToggle() {
  const enabled = isEnabled();
  demoToggle.classList.toggle('active', enabled);
  demoToggle.setAttribute('aria-pressed', String(enabled));
  demoToggle.lastChild.textContent = enabled ? ' Preview data on' : ' Preview data';
}

window.growthOSDemo = {
  isEnabled,
  query: () => (isEnabled() ? '?demo=1' : '')
};

demoToggle.addEventListener('click', () => {
  window.localStorage.setItem(demoStorageKey, String(!isEnabled()));
  window.location.reload();
});

applyToggle();
