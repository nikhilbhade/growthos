(function () {
  const appUrl = '/app.html';
  const authStatus = document.querySelector('[data-auth-status]');
  const nativeFetch = window.fetch.bind(window);
  let clientPromise;

  async function config() {
    const response = await nativeFetch('/api/auth/config', { credentials: 'same-origin' });
    if (!response.ok) return { enabled: false };
    return response.json();
  }

  async function client() {
    if (!clientPromise) clientPromise = config().then(settings => ({
      settings,
      supabase: settings.enabled && window.supabase
        ? window.supabase.createClient(settings.url, settings.anonKey, { auth: { flowType: 'pkce', detectSessionInUrl: false } })
        : null
    }));
    return clientPromise;
  }

  async function authenticatedFetch(input, init) {
    const requestUrl = typeof input === 'string' ? input : input.url;
    const isGrowthosApi = requestUrl.startsWith('/api/') && requestUrl !== '/api/auth/config';
    if (!isGrowthosApi) return nativeFetch(input, init);
    const { supabase } = await client();
    if (!supabase) return nativeFetch(input, init);
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) return nativeFetch(input, init);
    const headers = new Headers(init?.headers || (typeof input === 'string' ? undefined : input.headers));
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
    return nativeFetch(input, { ...init, headers });
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

  async function completeOAuthCallback() {
    const callback = new URLSearchParams(window.location.search);
    const callbackError = callback.get('error_description') || callback.get('error');
    if (callbackError) return { error: new Error(callbackError) };

    const code = callback.get('code');
    if (!code) return { error: null };

    const { supabase } = await client();
    if (!supabase) return { error: new Error('The secure sign-in service did not load. Please refresh and try again.') };

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
    return { error };
  }

  async function guardDashboard() {
    if (!document.body.matches('[data-dashboard]')) return;
    const { settings, supabase } = await client();
    const callback = await completeOAuthCallback();
    if (callback.error) {
      window.location.replace(`/?auth_error=${encodeURIComponent(callback.error.message)}`);
      return;
    }
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

  const pageError = new URLSearchParams(window.location.search).get('auth_error');
  if (pageError && authStatus) authStatus.textContent = `Sign-in could not be completed: ${pageError}`;
  document.querySelectorAll('[data-google-login]').forEach(button => button.addEventListener('click', async event => {
    event.preventDefault();
    const { supabase } = await client();
    if (!supabase) {
      if (authStatus) authStatus.textContent = 'Google sign-in is unavailable right now. Please refresh and try again.';
      return;
    }
    redirectToGoogleSignIn();
  }));
  window.fetch = authenticatedFetch;
  guardDashboard();
})();
