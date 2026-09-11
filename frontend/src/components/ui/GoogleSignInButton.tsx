import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

interface GoogleSignInButtonProps {
  className?: string;
  compact?: boolean;
}

export function GoogleSignInButton({ className = "", compact = false }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setError(undefined);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in could not be started.");
      setIsLoading(false);
    }
  }

  return (
    <div className={`sign-in-control ${className}`.trim()}>
      <button className="google-button" type="button" onClick={handleSignIn} disabled={isLoading}>
        <span className="google-mark" aria-hidden="true">G</span>
        <span>{isLoading ? "Opening Google..." : compact ? "Log in" : "Log in with Google"}</span>
      </button>
      {error ? <span className="form-error" role="alert">{error}</span> : null}
    </div>
  );
}
