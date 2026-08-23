const pageByHash = { '#market': 'market', '#ranking': 'market', '#pricing': 'market', '#agents': 'agents', '#meta': 'meta', '#tiktok': 'tiktok', '#google': 'google', '#delivery': 'delivery', '#context': 'context', '#retention': 'retention', '#variance': 'variance', '#workflows': 'workflows', '#settings': 'settings' };
const navigationLinks = [...document.querySelectorAll('.sidebar nav a')];

function setActivePage() {
  const hash = window.location.hash || '#growth';
  const page = pageByHash[hash] || 'analytics';
  document.body.dataset.page = page;
  navigationLinks.forEach(link => {
    const href = link.getAttribute('href');
    const isActive = (page === 'analytics' && href === '#growth')
      || (page === 'market' && (href === '#market' || href === hash))
      || href === `#${page}`;
    link.classList.toggle('active', isActive);
  });
  if (hash === '#ranking' || hash === '#pricing') {
    requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

window.addEventListener('hashchange', setActivePage);
setActivePage();
