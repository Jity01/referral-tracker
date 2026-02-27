import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Maurice Blackburn Client Care</span>
          <span className="mb-badge-sub">Technology partner: Osmaura</span>
        </span>
        <h1 className="hero-title">Terms & Conditions</h1>
        <p className="hero-copy">
          By signing in to Osmaura for MB Client Care, you agree to these terms for access, acceptable use, and support
          services.
        </p>

        <section className="surface-grid" style={{ marginTop: 40 }}>
          <article className="card">
            <h2>Using this portal</h2>
            <ul className="list-reset small muted">
              <li>Use your own registered account only.</li>
              <li>Keep your login secure and do not share access.</li>
              <li>Use this portal for case-support related actions and communication.</li>
              <li>Do not misuse or attempt to interfere with service availability.</li>
            </ul>
          </article>
          <article className="card">
            <h2>Service scope</h2>
            <ul className="list-reset small muted">
              <li>Osmaura provides support workflows and status updates to MB Client Care.</li>
              <li>Feature availability may change as the service improves.</li>
              <li>Support responses may depend on case complexity and vendor participation.</li>
            </ul>
          </article>
          <article className="card">
            <h2>Your options</h2>
            <ul className="list-reset small muted">
              <li>You can request a vendor switch if your current service is not a fit.</li>
              <li>You can pause automated monitoring from your portal.</li>
              <li>You can contact MB support to review or withdraw consent.</li>
            </ul>
            <p className="small muted">Terms version: 2026-02-27</p>
            <p className="small">
              <Link href="/privacy">View Privacy</Link>
            </p>
            <p className="small">
              <Link href="/">Back to login</Link>
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
