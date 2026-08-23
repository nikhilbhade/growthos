const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileNavScrim = document.getElementById('mobileNavScrim');
const mobileNavLinks = document.querySelectorAll('.sidebar nav a');

function setMobileNav(open) {
  document.body.classList.toggle('mobile-nav-open', open);
  mobileNavToggle?.setAttribute('aria-expanded', String(open));
}

mobileNavToggle?.addEventListener('click', () => setMobileNav(!document.body.classList.contains('mobile-nav-open')));
mobileNavScrim?.addEventListener('click', () => setMobileNav(false));
mobileNavLinks.forEach(link => link.addEventListener('click', () => setMobileNav(false)));
window.addEventListener('keydown', event => { if (event.key === 'Escape') setMobileNav(false); });
