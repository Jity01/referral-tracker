import Link from "next/link";
import { getClient } from "../../lib/store.js";
import { buildClientReport } from "../../lib/domain.js";
import { analyzeBothSimulatedCases } from "../../lib/email-report-analyzer.js";

const METRIC_LABELS = {
  clientEngagement: "Client engagement",
  responsiveness: "Vendor responsiveness",
  communicationQuality: "Communication quality",
  clientSatisfaction: "Client satisfaction",
  clientKeptInformed: "Client kept informed",
  outcome: "Outcome"
};

function MetricBlock({ label, metric, isOutcome = false }) {
  if (!metric) return null;
  const score = metric.score;
  const definition = metric.definition;
  const reasoning = metric.reasoning;
  const summary = metric.summary;

  if (isOutcome) {
    return (
      <details className="report-details" style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, padding: "12px 16px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
          {label} — {summary || metric.type}
        </summary>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {definition ? <p className="small muted" style={{ margin: "0 0 12px" }}><strong>What we measure:</strong> {definition}</p> : null}
          {reasoning ? <p className="small" style={{ margin: 0 }}>{reasoning}</p> : null}
        </div>
      </details>
    );
  }

  return (
    <details className="report-details" style={{ marginBottom: 12 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, padding: "12px 16px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
        {label} — {score}/100
      </summary>
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        {definition ? <p className="small muted" style={{ margin: "0 0 12px" }}><strong>What we measure:</strong> {definition}</p> : null}
        {reasoning ? <p className="small" style={{ margin: 0 }}>{reasoning}</p> : null}
      </div>
    </details>
  );
}

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

      {/* ——— QUICK OVERVIEW ——— */}
      <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Quick overview</h3>
        {emailAnalysis?.executiveSummary ? (
          <p className="small" style={{ margin: "0 0 16px" }}>{emailAnalysis.executiveSummary}</p>
        ) : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {emailAnalysis?.clientEngagement?.score != null && <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Engagement: {emailAnalysis.clientEngagement.score}</span>}
          {emailAnalysis?.clientSatisfaction?.score != null && <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Satisfaction: {emailAnalysis.clientSatisfaction.score}</span>}
          {emailAnalysis?.responsiveness?.score != null && <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>Responsiveness: {emailAnalysis.responsiveness.score}</span>}
          {emailAnalysis?.outcome?.summary && <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>{emailAnalysis.outcome.summary.slice(0, 40)}…</span>}
        </div>
        <ul className="list-reset small muted" style={{ margin: 0 }}>
          <li><strong>Avg response time:</strong> {report.vendorHealth.avgResponseHours} hours</li>
          <li><strong>Case ended:</strong> {report.caseEnd.ended ? "Yes" : "No"} — {report.caseEnd.reason}</li>
          {report.recommendation ? <li><strong>Alternative vendor:</strong> {report.recommendation.name}</li> : null}
        </ul>
      </div>

      {/* ——— METRICS (MB TRACKING: Did client engage? Were they satisfied? What was the outcome?) ——— */}
      {emailAnalysis ? (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ margin: "0 0 8px" }}>Quality metrics</h3>
          <p className="small muted" style={{ margin: "0 0 20px" }}>
            MB tracks what happens after handoff: engagement, satisfaction, outcome. Each metric has a definition and evidence-based reasoning. Expand for details.
          </p>

          <MetricBlock label={METRIC_LABELS.clientEngagement} metric={emailAnalysis.clientEngagement} />
          <MetricBlock label={METRIC_LABELS.clientSatisfaction} metric={emailAnalysis.clientSatisfaction} />
          <MetricBlock label={METRIC_LABELS.outcome} metric={emailAnalysis.outcome} isOutcome />
          <MetricBlock label={METRIC_LABELS.responsiveness} metric={emailAnalysis.responsiveness} />
          <MetricBlock label={METRIC_LABELS.communicationQuality} metric={emailAnalysis.communicationQuality} />
          <MetricBlock label={METRIC_LABELS.clientKeptInformed} metric={emailAnalysis.clientKeptInformed} />
        </div>
      ) : null}

      {/* ——— EXPANDABLE: Case lifecycle narrative ——— */}
      {emailAnalysis?.caseLifecycleNarrative ? (
        <details className="report-details" style={{ marginTop: 28 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Case lifecycle — what happened
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>{emailAnalysis.caseLifecycleNarrative}</p>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Notable events ——— */}
      {emailAnalysis?.notableEvents?.length > 0 ? (
        <details className="report-details" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Notable events ({emailAnalysis.notableEvents.length})
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <ul className="list-reset small" style={{ margin: 0 }}>
              {emailAnalysis.notableEvents.map((ev, i) => (
                <li key={i} style={{ marginBottom: 12 }}>
                  <strong>{ev.event}</strong>
                  <p className="muted" style={{ margin: "4px 0 0" }}>{ev.significance}</p>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Sentiment progression ——— */}
      {emailAnalysis?.sentimentProgression ? (
        <details className="report-details" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Sentiment progression
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="small muted" style={{ margin: 0 }}>{emailAnalysis.sentimentProgression}</p>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Key quotes ——— */}
      {emailAnalysis?.keyQuotes?.length > 0 ? (
        <details className="report-details" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Key client quotes ({emailAnalysis.keyQuotes.length})
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <ul className="list-reset small" style={{ margin: 0, paddingLeft: 20 }}>
              {emailAnalysis.keyQuotes.map((q, i) => (
                <li key={i} style={{ marginBottom: 8, fontStyle: "italic" }}>"{q}"</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Milestones ——— */}
      {emailAnalysis?.milestones?.length > 0 ? (
        <details className="report-details" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Milestones ({emailAnalysis.milestones.length})
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <ul className="list-reset small" style={{ margin: 0, paddingLeft: 20 }}>
              {emailAnalysis.milestones.map((m, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{m}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Red flags ——— */}
      {emailAnalysis?.redFlags?.length > 0 ? (
        <details className="report-details" style={{ marginTop: 12 }} open>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(163,59,59,0.1)", borderRadius: 10, color: "#a33b3b" }}>
            Red flags ({emailAnalysis.redFlags.length})
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(163,59,59,0.2)", background: "rgba(163,59,59,0.05)" }}>
            <ul className="list-reset small" style={{ margin: 0, color: "#a33b3b" }}>
              {emailAnalysis.redFlags.map((flag, i) => <li key={i} style={{ marginBottom: 8 }}>{flag}</li>)}
            </ul>
          </div>
        </details>
      ) : null}

      {/* ——— EXPANDABLE: Fee discussion ——— */}
      {emailAnalysis?.feeDiscussion ? (
        <details className="report-details" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
            Fee and cost discussion
          </summary>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="small muted" style={{ margin: 0 }}>{emailAnalysis.feeDiscussion}</p>
          </div>
        </details>
      ) : null}

      {/* ——— Signal-based vendor health (from store) ——— */}
      <details className="report-details" style={{ marginTop: 28 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, padding: "14px 18px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
          Signal-based vendor health
        </summary>
        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <ul className="list-reset small" style={{ margin: 0 }}>
            <li><strong>Health:</strong> <span style={{ color: healthColor }}>{report.vendorHealth.health}</span></li>
            <li><strong>Avg response time:</strong> {report.vendorHealth.avgResponseHours} hours</li>
            <li><strong>Avg satisfaction:</strong> {report.vendorHealth.avgSatisfaction}/5</li>
            <li><strong>Missed check-ins:</strong> {report.vendorHealth.missedCheckins}</li>
            {report.vendorHealth.issues?.length > 0 ? <li><strong>Issues:</strong> {report.vendorHealth.issues.join(" ")}</li> : null}
            <li><strong>Monitoring:</strong> {report.monitoringPolicy.shouldMonitor ? "Active" : "Stopped"} — {report.monitoringPolicy.reason}</li>
          </ul>
        </div>
      </details>

      {report.recommendation ? (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: "rgba(166, 124, 46, 0.08)", border: "1px solid rgba(166, 124, 46, 0.15)" }}>
          <h3 style={{ marginTop: 0 }}>Alternative vendor recommended</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            {report.recommendation.name} — {report.recommendation.fitReason}
          </p>
        </div>
      ) : null}

      <p className="muted small" style={{ marginTop: 24 }}>
        Generated {new Date(report.generatedAt).toLocaleString()} · Static analysis (demo)
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
            npm run seed:cases
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
  const emailAnalysis = analyzeBothSimulatedCases();

  return (
    <main className="page-shell">
      <div className="page-max">
        <span className="mb-badge">
          <span className="mb-badge-main">Closed-loop tracking</span>
          <span className="mb-badge-sub">MB referral quality assurance</span>
        </span>
        <h1 className="hero-title">Referral case reports</h1>
        <p className="hero-copy">
          MB refers matters to vetted external providers. To make this work commercially and maintain quality, we track what happens after handoff: <strong>Did the client engage? Were they satisfied? What was the outcome?</strong> These reports show closed-loop tracking across the referral network.
        </p>
        <p className="small muted" style={{ marginTop: 16 }}>
          Each report includes a quick overview, then expandable sections for metrics (with definitions and reasoning), case lifecycle narrative, notable events, and red flags. Every score has evidence-based reasoning—expand any metric for details.
        </p>
        <p style={{ marginTop: 24 }}>
          <Link href="/" className="subtle-btn" style={{ padding: "6px 12px", display: "inline-block", fontSize: 14 }}>
            ← Back to home
          </Link>
        </p>

        <div
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 40
          }}
        >
          <ReportCard caseLabel="Case 1 (auto collision)" client={case1} report={report1} variant="good" emailAnalysis={emailAnalysis.case1} />
          <ReportCard caseLabel="Case 2 (premises injury)" client={case2} report={report2} variant="poor" emailAnalysis={emailAnalysis.case2} />
        </div>
      </div>
    </main>
  );
}
