"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import StopMonitoringButton from "./StopMonitoringButton.js";

function formatPolicyLabel(policy) {
  if (policy.strictness === "lenient") return "Active support monitoring";
  if (policy.strictness === "strict") return "Elevated support monitoring";
  if (policy.strictness === "case_ended") return "Case closed monitoring";
  return "Client-controlled monitoring";
}

function formatProviderLabel(provider) {
  if (provider === "azure-ad") return "Outlook";
  if (provider === "google") return "Google";
  return "Email";
}

export default function ClientExperience({ client, report, digest, feedback, authMethod, consents, simulatedCaseReports = [] }) {
  const [activeTab, setActiveTab] = useState("vendor");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [requestedSwitch, setRequestedSwitch] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [recommendation, setRecommendation] = useState(report.recommendation);

  const selfHelpItems = useMemo(
    () => (digest?.items ?? []).filter((item) => item.startsWith("Self-help:")).map((item) => item.replace("Self-help: ", "")),
    [digest?.items]
  );

  const selfHelpMaterials = digest?.selfHelpMaterials ?? null;

  async function submitFeedback(event) {
    event.preventDefault();
    setSubmitState("saving");
    setSubmitMessage("");
    try {
      const response = await fetch("/api/client/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.clientId,
          message,
          severity,
          requestedSwitch
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit your message right now.");
      }

      setSubmitState("done");
      setSubmitMessage(result.message);
      setRecommendation(result.recommendation ?? recommendation);
      setMessage("");
      setRequestedSwitch(false);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Unable to submit your message right now.");
    }
  }

  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Maurice Blackburn Client Care</span>
          <span className="mb-badge-sub">
            Technology partner: Osmaura | Signed in with {formatProviderLabel(authMethod)}
          </span>
        </span>
        <h1 className="hero-title">Welcome to Osmaura, {client.fullName}</h1>
        <p className="hero-copy">
          Your MB support space keeps your referred vendor details, case status, and help resources together so you can
          always see where things stand.
        </p>
        <p className="small muted" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="subtle-btn"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ padding: "6px 10px" }}
          >
            Sign out
          </button>
        </p>

        <div className="tab-row">
          <button
            type="button"
            className={`tab-btn ${activeTab === "vendor" ? "active" : ""}`}
            onClick={() => setActiveTab("vendor")}
          >
            Vendor Information
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "self-help" ? "active" : ""}`}
            onClick={() => setActiveTab("self-help")}
          >
            Self-Help Materials
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
        </div>

        {activeTab === "vendor" ? (
          <section className="split">
            <article className="card">
              <h2>Your referred vendor</h2>
              <p className="muted small">Case type: {client.matterType.replaceAll("_", " ")}</p>
              <ul className="list-reset">
                <li>
                  <strong>Vendor:</strong> {report.currentVendor.name}
                </li>
                <li>
                  <strong>Contact:</strong> {report.currentVendor.contactName}
                </li>
                <li>
                  <strong>Email:</strong> {report.currentVendor.contactEmail}
                </li>
                <li>
                  <strong>Tracking mode:</strong> {formatPolicyLabel(report.monitoringPolicy)}
                </li>
              </ul>
              {recommendation ? (
                <div style={{ marginTop: 20, padding: 20, borderRadius: 14, background: "rgba(166, 124, 46, 0.08)", border: "1px solid rgba(166, 124, 46, 0.15)" }}>
                  <h3 style={{ marginTop: 0 }}>Alternative vendor ready</h3>
                  <p className="small muted" style={{ marginTop: 0 }}>
                    If your current service is not working for you, MB can help transition to:
                  </p>
                  <p style={{ marginBottom: 6 }}>
                    <strong>{recommendation.name}</strong> ({recommendation.contactName})
                  </p>
                  <p className="small muted" style={{ margin: 0 }}>
                    {recommendation.fitReason}
                  </p>
                </div>
              ) : null}
            </article>

            <article className="card">
              <h2>Report a concern</h2>
              <p className="muted small">
                Tell us what feels unsatisfactory and we will review this with care. You can also request a vendor
                switch. MB support will respond quickly and keep you updated.
              </p>
              <form onSubmit={submitFeedback}>
                <label className="field-label" htmlFor="severity">
                  Concern level
                </label>
                <select
                  id="severity"
                  className="select-input"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                >
                  <option value="low">Low - minor issue</option>
                  <option value="medium">Medium - quality concern</option>
                  <option value="high">High - urgent quality issue</option>
                </select>
                <label className="field-label" htmlFor="message">
                  What happened?
                </label>
                <textarea
                  id="message"
                  className="text-area"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share your experience so we can help quickly."
                  required
                />
                <label className="field-label" htmlFor="requested-switch">
                  <input
                    id="requested-switch"
                    type="checkbox"
                    checked={requestedSwitch}
                    onChange={(event) => setRequestedSwitch(event.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  I would like MB to explore an alternative vendor.
                </label>
                <button type="submit" className="primary-btn" disabled={submitState === "saving"}>
                  {submitState === "saving" ? "Sending..." : "Send to MB support"}
                </button>
              </form>
              {submitMessage ? (
                <p className={submitState === "error" ? "error-text small" : "ok-text small"}>{submitMessage}</p>
              ) : null}
            </article>
          </section>
        ) : null}

        {activeTab === "self-help" ? (
          <section className="surface-grid">
            <article className="card">
              <h2>Self-help materials</h2>
              <p className="muted small">Practical resources to support you while your case progresses.</p>
              {selfHelpMaterials && selfHelpMaterials.length > 0 ? (
                <div className="self-help-materials">
                  {selfHelpMaterials.map((material, index) => (
                    <details key={index} className="self-help-card">
                      <summary className="self-help-summary">{material.title}</summary>
                      <div className="self-help-content">
                        <p className="small">{material.description}</p>
                        {material.keyPoints && material.keyPoints.length > 0 ? (
                          <ul className="list-reset small muted" style={{ marginTop: 8 }}>
                            {material.keyPoints.map((point, i) => (
                              <li key={i} style={{ marginBottom: 4 }}>
                                {point}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <ul className="list-reset">
                  {selfHelpItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
            <article className="card">
              <h3>Recent check-ins</h3>
              <ul className="list-reset small muted">
                {(feedback ?? []).slice(0, 3).map((entry) => (
                  <li key={entry.submittedAt}>
                    {entry.message} ({entry.severity})
                  </li>
                ))}
                {(feedback ?? []).length === 0 ? <li>No concerns reported yet.</li> : null}
              </ul>
            </article>
          </section>
        ) : null}

        {activeTab === "reports" ? (
          <section className="reports-tab">
            <article className="card small">
              <h3>Your quality assurance report</h3>
              <p className="muted">
                These are active for MB review and escalation support. You can view them, but your primary focus should
                remain on your vendor progress and support actions.
              </p>
              <p className="muted">
                Vendor health: <strong>{report.vendorHealth.health}</strong> | Average response hours:{" "}
                <strong>{report.vendorHealth.avgResponseHours}</strong> | Average satisfaction:{" "}
                <strong>{report.vendorHealth.avgSatisfaction}</strong>
              </p>
              {consents?.[0] ? (
                <p className="muted">
                  Latest consent: <strong>{consents[0].provider}</strong> | Terms:{" "}
                  <strong>{consents[0].termsVersion}</strong>
                </p>
              ) : null}
              <StopMonitoringButton clientId={client.clientId} />
            </article>
            {simulatedCaseReports.length > 0 ? (
              <div style={{ marginTop: 40 }}>
                <h3 style={{ marginBottom: 16 }}>Simulated case reports</h3>
                <p className="muted small" style={{ marginBottom: 24 }}>
                  Reference reports for case 1 (good vendor) vs case 2 (poor vendor) from the email simulation.
                </p>
                <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  {simulatedCaseReports.map(({ client: c, report: r, label, emailAnalysis: ea }) => {
                    const healthColor = r.vendorHealth.health === "good" ? "#1d7740" : r.vendorHealth.health === "at_risk" ? "#b8860b" : "#a33b3b";
                    return (
                      <article key={c.clientId} className="card" style={{ borderLeft: `4px solid ${healthColor}` }}>
                        <h4 style={{ margin: "0 0 8px" }}>{label}</h4>
                        <p className="muted small" style={{ margin: 0 }}>
                          {c.fullName} · {c.matterType.replaceAll("_", " ")}
                        </p>
                        <ul className="list-reset small" style={{ marginTop: 16 }}>
                          <li><strong>Health:</strong> <span style={{ color: healthColor }}>{r.vendorHealth.health}</span></li>
                          <li><strong>Avg response:</strong> {r.vendorHealth.avgResponseHours}h</li>
                          <li><strong>Avg satisfaction:</strong> {r.vendorHealth.avgSatisfaction}/5</li>
                          <li><strong>Case ended:</strong> {r.caseEnd.ended ? "Yes" : "No"}</li>
                          {r.recommendation ? <li><strong>Alternative:</strong> {r.recommendation.name}</li> : null}
                        </ul>
                        {ea ? (
                          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                            <h5 style={{ margin: "0 0 12px", fontSize: 13 }}>Email thread analysis</h5>
                            {ea.executiveSummary ? <p className="small muted" style={{ margin: "0 0 12px" }}>{ea.executiveSummary}</p> : null}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                              {ea.responsiveness && <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.06)", fontSize: 11 }}>Responsiveness: {ea.responsiveness.score}</span>}
                              {ea.communicationQuality && <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.06)", fontSize: 11 }}>Communication: {ea.communicationQuality.score}</span>}
                              {ea.clientSatisfaction && <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.06)", fontSize: 11 }}>Satisfaction: {ea.clientSatisfaction.score}</span>}
                              {ea.clientKeptInformed?.score != null ? <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.06)", fontSize: 11 }}>Informed: {ea.clientKeptInformed.score}</span> : null}
                            </div>
                            {ea.sentimentProgression ? <p className="small muted" style={{ margin: "0 0 8px", fontSize: 11 }}>{ea.sentimentProgression}</p> : null}
                            {ea.outcome?.summary ? <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Outcome:</strong> {ea.outcome.summary}</p> : null}
                            {ea.keyQuotes?.length > 0 ? <p className="small muted" style={{ margin: "0 0 8px", fontStyle: "italic" }}>"{ea.keyQuotes[0]}"</p> : null}
                            {ea.redFlags?.length > 0 ? (
                              <ul className="list-reset small" style={{ margin: 0, color: "#a33b3b", fontSize: 11 }}>
                                {ea.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
