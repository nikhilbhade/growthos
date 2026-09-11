import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface AuthConfig {
  enabled: boolean;
  required: boolean;
  url: string | null;
  anonKey: string | null;
}

let clientPromise: Promise<SupabaseClient | null> | undefined;

async function createAuthClient(): Promise<SupabaseClient | null> {
  const response = await fetch("/api/auth-config", { credentials: "same-origin" });
  if (!response.ok) return null;

  const config = (await response.json()) as AuthConfig;
  if (!config.enabled || !config.url || !config.anonKey) return null;

  return createClient(config.url, config.anonKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false },
  });
}

function getAuthClient() {
  clientPromise ??= createAuthClient().catch(() => null);
  return clientPromise;
}

export async function signInWithGoogle(): Promise<void> {
  const client = await getAuthClient();
  if (!client) {
    throw new Error("Google sign-in is not configured yet.");
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/app.html` },
  });

  if (error) throw error;
}
