import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const AUTH_CONFIG_PATH = "/api/auth-config";
const AUTH_ACCESS_PATH = "/api/auth/access";
const DASHBOARD_PATH = "/app.html";
const ANALYTICS_DASHBOARD_URL = `${DASHBOARD_PATH}#growth`;

export interface AuthSettings {
  enabled: boolean;
  required: boolean;
  url: string | null;
  anonKey: string | null;
}

interface ResolvedClient {
  settings: AuthSettings;
  supabase: SupabaseClient | null;
}

let clientPromise: Promise<ResolvedClient> | null = null;

async function config(): Promise<AuthSettings> {
  try {
    const response = await fetch(AUTH_CONFIG_PATH, { credentials: "same-origin" });
    if (!response.ok) return { enabled: false, required: false, url: null, anonKey: null };
    return (await response.json()) as AuthSettings;
  } catch {
    return { enabled: false, required: false, url: null, anonKey: null };
  }
}

export function resolveClient(): Promise<ResolvedClient> {
  if (!clientPromise) {
    clientPromise = config().then((settings) => ({
      settings,
      supabase:
        settings.enabled && settings.url && settings.anonKey
          ? createClient(settings.url, settings.anonKey, {
              auth: { flowType: "pkce", detectSessionInUrl: false },
            })
          : null,
    }));
  }
  return clientPromise;
}

/** Attach the Supabase bearer token to Gradient AI API requests. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isGrowthosApi = input.startsWith("/api/") && input !== AUTH_CONFIG_PATH;
  if (!isGrowthosApi) return fetch(input, init);
  const { supabase } = await resolveClient();
  if (!supabase) return fetch(input, init);
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) return fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return fetch(input, { ...init, headers });
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const { supabase } = await resolveClient();
  if (!supabase) return { error: new Error("Google sign-in is being configured for this workspace.") };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${DASHBOARD_PATH}` },
  });
  return { error };
}

async function verifyWorkspaceAccess(supabase: SupabaseClient): Promise<{ error: Error | null }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: new Error("Sign in is required.") };

  const response = await fetch(AUTH_ACCESS_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) return { error: null };

  const body = await response.json().catch(() => ({}));
  await supabase.auth.signOut();
  return { error: new Error(body.error || "This Google account is not approved for Gradient AI.") };
}

async function completeOAuthCallback(): Promise<{ error: Error | null }> {
  const callback = new URLSearchParams(window.location.search);
  const callbackError = callback.get("error_description") || callback.get("error");
  if (callbackError) return { error: new Error(callbackError) };
  const code = callback.get("code");
  if (!code) return { error: null };
  const { supabase } = await resolveClient();
  if (!supabase) return { error: new Error("The secure sign-in service did not load. Please refresh and try again.") };
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) window.history.replaceState({}, document.title, ANALYTICS_DASHBOARD_URL);
  return { error: error as Error | null };
}

export type GuardResult =
  | { status: "ok" }
  | { status: "redirect"; to: string }
  | { status: "misconfigured" };

/** Mirror of the legacy guardDashboard(): gate the dashboard behind Google auth. */
export async function guardDashboard(): Promise<GuardResult> {
  const { settings, supabase } = await resolveClient();
  const callback = await completeOAuthCallback();
  if (callback.error) {
    return { status: "redirect", to: `/?auth_error=${encodeURIComponent(callback.error.message)}` };
  }
  if (!settings.required) return { status: "ok" };
  if (!supabase) return { status: "misconfigured" };
  const access = await verifyWorkspaceAccess(supabase);
  if (access.error) return { status: "redirect", to: `/?auth_error=${encodeURIComponent(access.error.message)}` };
  if (!window.location.hash) window.history.replaceState({}, document.title, ANALYTICS_DASHBOARD_URL);
  return { status: "ok" };
}
