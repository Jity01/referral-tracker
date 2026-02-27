"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function ClientLoginPortal({ authError, availableProviders }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function onOAuthSignIn(provider) {
    setError("");
    if (!termsAccepted) {
      setError("Please accept the Privacy and Terms & Conditions before logging in.");
      return;
    }
    setStatus(provider);
    await signIn(provider, { callbackUrl: "/" });
  }

  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Maurice Blackburn Client Care</span>
          <span className="mb-badge-sub">Technology partner: Osmaura</span>
        </span>
        <h1 className="hero-title">A secure place to manage your referred vendor with confidence.</h1>
        <p className="hero-copy">
          Log in to see your referred vendor, track your case, and report anything that is not working so our team can
          support you and, when needed, help move you to a better-fit vendor.
        </p>
        <p className="small muted" style={{ marginTop: 24 }}>
          <Link href="/reports">View simulated case reports (case 1 vs case 2)</Link>
        </p>

        <section className="surface-grid">
          <article className="card">
            <h2>Osmaura Client Login</h2>
            <p className="muted small">Sign in securely with Google or Outlook.</p>
            <label className="field-label" htmlFor="terms-consent">
              <input
                id="terms-consent"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                style={{ marginRight: 8 }}
              />
              I accept the <Link href="/privacy">Privacy</Link> and{" "}
              <Link href="/terms">Terms & Conditions</Link>.
            </label>
            <div className="login-options" style={{ marginBottom: 12 }}>
              <button
                type="button"
                className="option-pill"
                disabled={status === "google" || !availableProviders.google}
                onClick={() => onOAuthSignIn("google")}
              >
                {!availableProviders.google
                  ? "Google not configured"
                  : status === "google"
                    ? "Connecting..."
                    : "Continue with Google"}
              </button>
              <button
                type="button"
                className="option-pill"
                disabled={status === "azure-ad" || !availableProviders.outlook}
                onClick={() => onOAuthSignIn("azure-ad")}
              >
                {!availableProviders.outlook
                  ? "Outlook not configured"
                  : status === "azure-ad"
                    ? "Connecting..."
                    : "Continue with Outlook"}
              </button>
            </div>
            {!availableProviders.google || !availableProviders.outlook ? (
              <p className="muted small">
                Configure provider credentials in `.env` to enable all sign-in options.
              </p>
            ) : null}
            {authError ? (
              <p className="error-text small">
                Login failed. If this is OAuth setup, check your provider client ID/secret and callback URLs.
              </p>
            ) : null}
            {error ? <p className="error-text small">{error}</p> : null}
          </article>

          <article className="card">
            <h3>MB Client Care through Osmaura</h3>
            <ul className="list-reset small muted">
              <li>Track your current vendor and case progress in one place.</li>
              <li>Raise concerns quickly if service quality falls below expectations.</li>
              <li>Get a clear path to alternative vendor support where needed.</li>
              <li>Access self-help materials to stay informed between updates.</li>
              <li>Your information and feedback are handled with confidentiality and care.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
