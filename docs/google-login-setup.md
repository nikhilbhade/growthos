# Google login setup

GrowthOS uses **Supabase Auth with Google** for its customer login. This keeps
Google client secrets out of the browser and gives the web application a
standard session after the OAuth redirect.

## Before enabling the access gate

1. In Google Cloud Console, create (or select) the GrowthOS project.
2. Configure the OAuth consent screen with GrowthOS branding and the
   production support/contact information.
3. Create an **OAuth client ID** of type **Web application**.
4. Add the Cloud Run production origin, for example
   `https://growthos-web-<hash>-uc.a.run.app`, to **Authorized JavaScript
   origins**. Add `http://localhost:3000` for local development only.
5. In **Authorized redirect URIs**, add the Supabase callback exactly as shown
   in Supabase Auth → Providers → Google. This normally has the form
   `https://<project-ref>.supabase.co/auth/v1/callback`.
6. In Supabase Auth → Providers → Google, enable Google and paste the Google
   client ID and client secret.
7. In Supabase Auth → URL Configuration, set the Site URL and add these exact
   redirect URLs:
   - `https://growthos-web-<hash>-uc.a.run.app/app.html`
   - `http://localhost:3000/app.html` (development only)
8. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the web application runtime.
   The anon key is a public identifier; the service-role key must remain in a
   private API/worker environment.
9. Sign in with a test Google Workspace user. Confirm the callback returns to
   `/app.html` and that the user appears in Supabase Auth → Users.
10. Add verified JWT middleware to every API that can return customer data;
    only then set `GROWTHOS_REQUIRE_AUTH=true`.

## Important boundary

The landing page and dashboard guard in this repository provide the customer
experience for Google sign-in. They are not, on their own, a complete API
authorization layer. Production customer data must be protected server-side by
verifying the Supabase access token, resolving the tenant membership, and
applying row-level security in the database.

Google requires exact redirect URI matches. Do not add broad wildcard redirect
URLs, and do not commit the Google client secret or Supabase service-role key.

## References

- [Supabase: Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google: OAuth 2.0 for web-server applications](https://developers.google.com/identity/protocols/oauth2/web-server)
