const wizardForm = document.getElementById('onboardingForm');
const wizardSteps = [...document.querySelectorAll('.wizard-step')];
const railSteps = [...document.querySelectorAll('#onboardingSteps li')];
const wizardFields = [...wizardForm.querySelectorAll('textarea')];
const progressLabel = document.getElementById('onboardingProgress');
const saveStatus = document.getElementById('saveStatus');
const toast = document.getElementById('saveToast');
let activeStep = 0;
let saveTimer;

function values() { return Object.fromEntries(new FormData(wizardForm)); }
function showToast() { toast.classList.remove('hidden'); }
function saveDraft() {
  clearTimeout(saveTimer); saveStatus.textContent = 'Saving…'; saveStatus.style.color = '#9c7c34';
  saveTimer = setTimeout(() => {
    try { localStorage.setItem('growthos-onboarding', JSON.stringify(values())); saveStatus.textContent = 'All changes saved'; saveStatus.style.color = '#3f846a'; toast.classList.add('hidden'); }
    catch { saveStatus.textContent = 'Couldn’t save · retry'; saveStatus.style.color = '#ae513a'; showToast(); }
  }, 420);
}
function updateRail() {
  railSteps.forEach((item, index) => { item.classList.toggle('active', index === activeStep); item.classList.toggle('complete', index < activeStep); });
  progressLabel.textContent = `Step ${activeStep + 1} of 4`;
  document.getElementById('wizardBack').disabled = activeStep === 0;
  document.getElementById('wizardNext').innerHTML = activeStep === wizardSteps.length - 1 ? 'Complete setup <span>→</span>' : 'Continue <span>→</span>';
}
function moveTo(nextStep) {
  if (nextStep < 0 || nextStep > wizardSteps.length) return;
  if (nextStep === wizardSteps.length) { saveDraft(); wizardSteps[activeStep].classList.remove('active'); document.querySelector('.wizard-footer').classList.add('hidden'); document.getElementById('completionState').classList.remove('hidden'); requestAnimationFrame(() => document.getElementById('completionState').classList.add('visible')); progressLabel.textContent = 'Complete'; railSteps.forEach(item => item.classList.add('complete')); return; }
  const current = wizardSteps[activeStep]; current.classList.add('exiting'); current.classList.remove('active');
  setTimeout(() => { current.classList.remove('exiting'); activeStep = nextStep; wizardSteps[activeStep].classList.add('active'); updateRail(); wizardSteps[activeStep].querySelector('textarea').focus({ preventScroll: true }); }, 235);
  saveDraft();
}
try { const saved = JSON.parse(localStorage.getItem('growthos-onboarding') || '{}'); wizardFields.forEach(field => field.value = saved[field.name] || ''); } catch { showToast(); }
wizardFields.forEach(field => field.addEventListener('input', saveDraft));
document.getElementById('wizardNext').addEventListener('click', () => moveTo(activeStep + 1));
document.getElementById('wizardBack').addEventListener('click', () => moveTo(activeStep - 1));
document.getElementById('wizardSkip').addEventListener('click', () => moveTo(activeStep + 1));
document.getElementById('retrySave').addEventListener('click', saveDraft);
updateRail();
