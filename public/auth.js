(function () {
  const appUrl = '/app.html';
  const authStatus = document.querySelector('[data-auth-status]');

  async function config() {
    const response = await fetch('/api/auth/config', { credentials: 'same-origin' });
    if (!response.ok) return { enabled: false };
    return response.json();
  }

  async function client() {
    const settings = await config();
    if (!settings.enabled || !window.supabase) return { settings, supabase: null };
    return { settings, supabase: window.supabase.createClient(settings.url, settings.anonKey, { auth: { flowType: 'pkce' } }) };
  }

  async function redirectToGoogleSignIn() {
    const { settings, supabase } = await client();
    if (!supabase) {
      if (authStatus) authStatus.textContent = 'Google sign-in is being configured for this workspace.';
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${appUrl}` } });
    if (error && authStatus) authStatus.textContent = error.message;
  }

  async function guardDashboard() {
    if (!document.body.matches('[data-dashboard]')) return;
    const { settings, supabase } = await client();
    if (!settings.required) return;
    if (!supabase) {
      document.body.innerHTML = '<main style="font:16px system-ui;padding:48px;max-width:620px;margin:auto"><h1>Sign-in configuration is incomplete.</h1><p>Set Supabase Google Auth configuration before enabling the production access gate.</p><a href="/">Return to GrowthOS</a></main>';
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.replace('/');
      return;
    }
    document.body.classList.add('authenticated');
  }

  document.querySelectorAll('[data-google-login]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); redirectToGoogleSignIn(); }));
  guardDashboard();
})();
