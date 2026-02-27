import Link from "next/link";
import { getClient } from "../../lib/store.js";
import { buildClientReport } from "../../lib/domain.js";
import { analyzeBothSimulatedCases } from "../../lib/email-report-analyzer.js";

function ReportCard({ caseLabel, client, report, variant, emailAnalysis }) {
  const isGood = variant === "good";
  const healthColor =
    report.vendorHealth.health === "good"
      ? "#1d7740"
      : report.vendorHealth.health === "at_risk"
        ? "#b8860b"
        : "#a33b3b";

  return (
    <article className="card" style={{ borderLeft: `4px solid ${healthColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ margin: 0 }}>
          {caseLabel} — {client.fullName}
        </h2>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            background: isGood ? "rgba(29,119,64,0.12)" : "rgba(163,59,59,0.12)",
            color: isGood ? "#1d7740" : "#a33b3b"
          }}
        >
          {isGood ? "Good vendor" : "Poor vendor"}
        </span>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Matter: {client.matterType.replaceAll("_", " ")} | Vendor: {report.currentVendor.name}
      </p>

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>Vendor health</h3>
      <ul className="list-reset small">
        <li>
          <strong>Health:</strong> <span style={{ color: healthColor }}>{report.vendorHealth.health}</span>
        </li>
        <li>
          <strong>Avg response time:</strong> {report.vendorHealth.avgResponseHours} hours
        </li>
        <li>
          <strong>Avg satisfaction:</strong> {report.vendorHealth.avgSatisfaction}/5
        </li>
        <li>
          <strong>Missed check-ins:</strong> {report.vendorHealth.missedCheckins}
        </li>
        {report.vendorHealth.issues?.length > 0 ? (
          <li>
            <strong>Issues:</strong> {report.vendorHealth.issues.join(" ")}
          </li>
        ) : null}
      </ul>

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>Case status</h3>
      <ul className="list-reset small">
        <li>
          <strong>Ended:</strong> {report.caseEnd.ended ? "Yes" : "No"}
        </li>
        <li>
          <strong>Reason:</strong> {report.caseEnd.reason}
        </li>
        <li>
          <strong>Monitoring:</strong> {report.monitoringPolicy.shouldMonitor ? "Active" : "Stopped"} —{" "}
          {report.monitoringPolicy.reason}
        </li>
      </ul>

      {report.recommendation ? (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: "rgba(166, 124, 46, 0.08)", border: "1px solid rgba(166, 124, 46, 0.15)" }}>
          <h3 style={{ marginTop: 0 }}>Alternative vendor recommended</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            {report.recommendation.name} — {report.recommendation.fitReason}
          </p>
        </div>
      ) : null}

      {emailAnalysis ? (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginTop: 0 }}>Email thread analysis</h3>
          <p className="small muted" style={{ marginBottom: 12 }}>Inferred from correspondence (LLM or rule-based).</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {emailAnalysis.responsiveness && <span title={emailAnalysis.responsiveness.reasoning} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Responsiveness: {emailAnalysis.responsiveness.score}</span>}
            {emailAnalysis.communicationQuality && <span title={emailAnalysis.communicationQuality.reasoning} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Communication: {emailAnalysis.communicationQuality.score}</span>}
            {emailAnalysis.clientSatisfaction && <span title={emailAnalysis.clientSatisfaction.reasoning} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Satisfaction: {emailAnalysis.clientSatisfaction.score}</span>}
          </div>
          {emailAnalysis.outcome?.summary ? <p className="small" style={{ margin: "0 0 8px" }}><strong>Outcome:</strong> {emailAnalysis.outcome.summary}</p> : null}
          {emailAnalysis.matterProgression ? <p className="small muted" style={{ margin: "0 0 8px" }}><strong>Progression:</strong> {emailAnalysis.matterProgression}</p> : null}
          {emailAnalysis.redFlags?.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <strong className="small" style={{ color: "#a33b3b" }}>Red flags:</strong>
              <ul className="list-reset small" style={{ margin: "4px 0 0", color: "#a33b3b" }}>
                {emailAnalysis.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
              </ul>
            </div>
          ) : null}
          {emailAnalysis.feeDiscussion ? <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}><strong>Fee discussion:</strong> {emailAnalysis.feeDiscussion}</p> : null}
        </div>
      ) : null}

      <p className="muted small" style={{ marginTop: 20 }}>
        Generated {new Date(report.generatedAt).toLocaleString()}
      </p>
    </article>
  );
}

export default async function ReportsPage() {
  const case1 = getClient("case-1");
  const case2 = getClient("case-2");

  if (!case1 || !case2) {
    return (
      <main className="page-shell">
        <div className="page-max">
          <span className="mb-badge">
            <span className="mb-badge-main">Case reports</span>
            <span className="mb-badge-sub">Simulated PI cases</span>
          </span>
          <h1 className="hero-title">Case reports not found</h1>
          <p className="hero-copy">
            Run the seed script to populate case-1 and case-2 with simulated data:
          </p>
          <pre style={{ background: "#f4f2ef", padding: 16, borderRadius: 12, overflow: "auto" }}>
            node scripts/seed-simulated-cases.js
          </pre>
          <p style={{ marginTop: 16 }}>
            <Link href="/" className="subtle-btn" style={{ padding: "8px 14px", display: "inline-block" }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const report1 = buildClientReport(case1);
  const report2 = buildClientReport(case2);
  const emailAnalysis = await analyzeBothSimulatedCases();

  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Case reports</span>
          <span className="mb-badge-sub">Simulated PI cases — case 1 vs case 2</span>
        </span>
        <h1 className="hero-title">Simulated case reports</h1>
        <p className="hero-copy">
          Quality assurance reports for two simulated PI matters. Case 1 shows a responsive, client-satisfactory vendor
          outcome. Case 2 shows delayed responses, low satisfaction, and recommended alternative vendor.
        </p>
        <p style={{ marginTop: 24 }}>
          <Link href="/" className="subtle-btn" style={{ padding: "6px 12px", display: "inline-block", fontSize: 14 }}>
            ← Back to home
          </Link>
        </p>

        <div
          className="surface-grid"
          style={{
            marginTop: 48,
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 32
          }}
        >
          <ReportCard caseLabel="Case 1 (auto collision)" client={case1} report={report1} variant="good" emailAnalysis={emailAnalysis.case1} />
          <ReportCard caseLabel="Case 2 (premises injury)" client={case2} report={report2} variant="poor" emailAnalysis={emailAnalysis.case2} />
        </div>
      </div>
    </main>
  );
}
