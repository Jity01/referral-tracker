import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Maurice Blackburn Client Care</span>
          <span className="mb-badge-sub">Technology partner: Osmaura</span>
        </span>
        <h1 className="hero-title">Privacy</h1>
        <p className="hero-copy">
          This page explains what information is used in the Osmaura MB Client Care portal and how it supports your case
          pathway.
        </p>

        <section className="surface-grid" style={{ marginTop: 40 }}>
          <article className="card">
            <h2>What we collect</h2>
            <ul className="list-reset small muted">
              <li>Your identity and login provider (Email, Google, Outlook).</li>
              <li>Case support updates, vendor response quality, and satisfaction check-ins.</li>
              <li>Feedback you submit about vendor service quality and switch requests.</li>
              <li>Read-only OAuth permissions where approved (mail/calendar signals only).</li>
            </ul>
          </article>
          <article className="card">
            <h2>How information is used</h2>
            <ul className="list-reset small muted">
              <li>To coordinate support and improve the client care pathway.</li>
              <li>To surface vendor quality concerns and escalation needs.</li>
              <li>To maintain portal access, case status, and service reliability.</li>
            </ul>
          </article>
          <article className="card">
            <h2>Your controls</h2>
            <ul className="list-reset small muted">
              <li>You can request a vendor switch if your current service is not a fit.</li>
              <li>You can pause automated monitoring from your portal.</li>
              <li>You can contact MB support to review or withdraw consent.</li>
            </ul>
            <p className="small">
              <Link href="/terms">View Terms & Conditions</Link>
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
