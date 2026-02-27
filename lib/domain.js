import { getSignals } from "./store.js";

const SELF_HELP_BY_MATTER = {
  employment: [
    "Fair Work Ombudsman dismissal rights overview",
    "Template chronology worksheet for workplace incidents"
  ],
  personal_injury: [
    "State accident support guidance",
    "Medical evidence checklist for injury claims"
  ],
  default: ["General legal support hub", "How to prepare evidence timeline"]
};

/** Case-specific self-help materials derived from the email simulation scenarios */
const SELF_HELP_BY_MATTER_SUBTYPE = {
  car_accident: [
    {
      title: "Dealing with insurance before you have a lawyer",
      description:
        "Insurance companies often request recorded statements early. These can be used against you later. Until you have legal representation, avoid giving statements, signing releases, or accepting settlements.",
      keyPoints: [
        "Do not give recorded statements to the at-fault driver's insurer",
        "Direct all contact to your lawyer once you have representation",
        "Keep copies of any correspondence you receive"
      ]
    },
    {
      title: "Medical records and evidence checklist for car accidents",
      description:
        "Your lawyer needs a complete picture of your injuries and treatment to build a strong case. Gather these documents as soon as possible.",
      keyPoints: [
        "ER records and discharge summaries",
        "All doctor and specialist notes",
        "MRI, X-ray, and other imaging reports",
        "Physical therapy records",
        "Pharmacy receipts for medications",
        "Police report number"
      ]
    },
    {
      title: "Wage loss documentation guide",
      description:
        "Lost wages are a recoverable part of your claim. Document everything to support your claim.",
      keyPoints: [
        "Last 4 pay stubs before the accident",
        "Employer letter listing exact dates missed and your hourly/daily rate",
        "PTO or sick leave used (still claimable)",
        "Keep a log of any out-of-pocket costs (Uber, meds, etc.)"
      ]
    },
    {
      title: "What to expect from representation letters",
      description:
        "Once your lawyer sends representation letters, all insurer contact should go through your lawyer. Do not discuss your case with insurers directly.",
      keyPoints: [
        "Representation letters go to at-fault carrier and your own carrier",
        "All contact goes through your lawyer's office",
        "Do not settle early—insurance may lowball before full case is built"
      ]
    }
  ],
  slip_and_fall: [
    {
      title: "Preservation letters for surveillance footage",
      description:
        "Many premises (stores, businesses) keep surveillance footage for only 30 days. A preservation letter demands they keep the evidence. This is time-sensitive.",
      keyPoints: [
        "Surveillance footage is often deleted after 30 days",
        "Send a preservation letter as soon as possible",
        "Ask your lawyer to confirm when and to whom it was sent",
        "If you have a deadline, escalate immediately"
      ]
    },
    {
      title: "Evidence checklist for premises liability",
      description:
        "Slip and fall cases often depend on what you can prove. Gather evidence quickly before it disappears.",
      keyPoints: [
        "Incident report from the premises",
        "Photos of the hazard (wet floor, uneven surface)",
        "Witness names and contact details",
        "Medical records (ER, specialists, surgery)",
        "Preservation letter for surveillance footage"
      ]
    },
    {
      title: "When to escalate your case",
      description:
        "If your vendor is slow to respond, misses deadlines, or makes errors (e.g., filing under wrong case), you have options.",
      keyPoints: [
        "Request claim references and proof of provider contact",
        "Ask for supervisor contact if confidence is low",
        "You can request your complete file and a withdrawal letter",
        "Consider escalating to MB support for alternative vendor options"
      ]
    },
    {
      title: "Representation notice to the insurer",
      description:
        "Once you have a lawyer, the premises insurer should be notified. They should stop contacting you directly.",
      keyPoints: [
        "Representation letter stops the insurer from calling you directly",
        "Confirm with your lawyer that this was sent",
        "If you still receive calls, document them and report to your lawyer"
      ]
    }
  ]
};

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function detectCaseEnd(signals) {
  const explicitCaseEnd = signals.find((signal) =>
    ["case_closed", "settlement_paid", "matter_resolved"].includes(signal.type)
  );
  if (explicitCaseEnd) {
    return {
      ended: true,
      confidence: 0.95,
      reason: `Detected explicit end signal: ${explicitCaseEnd.type}`
    };
  }

  const staleSignals = signals.filter((signal) => signal.type === "inactivity_days").map((signal) => signal.value);
  if (staleSignals.some((days) => days >= 45)) {
    return {
      ended: true,
      confidence: 0.65,
      reason: "Extended inactivity suggests the case has likely ended."
    };
  }

  return { ended: false, confidence: 0.2, reason: "No case-end signals detected." };
}

export function evaluateVendorHealth(signals) {
  const responseHours = signals.filter((signal) => signal.type === "vendor_response_hours").map((signal) => signal.value);
  const satisfactionScores = signals
    .filter((signal) => signal.type === "client_satisfaction")
    .map((signal) => signal.value);
  const missedCheckins = signals.filter((signal) => signal.type === "checkin_missed").length;

  const avgResponseHours = average(responseHours);
  const avgSatisfaction = average(satisfactionScores);

  let health = "good";
  const issues = [];
  if (avgResponseHours > 72) {
    health = "poor";
    issues.push("Vendor response time is slower than SLA.");
  }
  if (avgSatisfaction > 0 && avgSatisfaction < 3) {
    health = "poor";
    issues.push("Client satisfaction is low.");
  }
  if (missedCheckins >= 2) {
    health = "at_risk";
    issues.push("Multiple missed check-ins detected.");
  }

  if (health === "good" && avgResponseHours > 48) {
    health = "at_risk";
  }

  return {
    health,
    avgResponseHours: Number(avgResponseHours.toFixed(1)),
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    missedCheckins,
    issues
  };
}

export function deriveMonitoringPolicy(client, caseEnd) {
  if (client.monitoringStopped) {
    return { shouldMonitor: false, strictness: "client_stopped", reason: client.stopReason ?? "User requested stop." };
  }

  if (caseEnd.ended) {
    return { shouldMonitor: false, strictness: "case_ended", reason: caseEnd.reason };
  }

  if (client.relationshipWithVendor === "still_ours") {
    return {
      shouldMonitor: true,
      strictness: "lenient",
      reason: "Client relationship remains with our side, monitoring can continue."
    };
  }

  return {
    shouldMonitor: true,
    strictness: "strict",
    reason: "Client relationship is transferred/unclear; continue only for active-case support checks."
  };
}

export function recommendAlternativeVendor(client, vendorHealth) {
  if (vendorHealth.health === "good") return null;
  const alternative = (client.vendorAlternatives ?? [])[0];
  if (!alternative) return null;
  return {
    vendorId: alternative.vendorId,
    name: alternative.name,
    contactName: alternative.contactName,
    contactEmail: alternative.contactEmail,
    fitReason: alternative.fitReason
  };
}

/** Returns case-specific self-help materials when matterSubtype is set, otherwise null */
export function getSelfHelpMaterials(client) {
  const subtype = client.matterSubtype;
  if (subtype && SELF_HELP_BY_MATTER_SUBTYPE[subtype]) {
    return SELF_HELP_BY_MATTER_SUBTYPE[subtype];
  }
  return null;
}

export function buildDigest(client, report) {
  const shouldMonitor = report.monitoringPolicy?.shouldMonitor ?? true;
  if (!shouldMonitor) {
    return {
      clientId: client.clientId,
      subject: `Monitoring stopped for ${client.fullName}`,
      items: [`Monitoring is stopped: ${report.monitoringPolicy?.reason ?? "Monitoring disabled."}`],
      selfHelpMaterials: null
    };
  }

  const richMaterials = getSelfHelpMaterials(client);
  const resources = richMaterials
    ? richMaterials.map((m) => m.title)
    : SELF_HELP_BY_MATTER[client.matterType] ?? SELF_HELP_BY_MATTER.default;

  const items = [
    "Weekly progress check-in",
    "Satisfaction pulse survey",
    ...resources.map((resource) => `Self-help: ${resource}`)
  ];

  if (report.recommendation) {
    items.push(`Redirect option: ${report.recommendation.name} (${report.recommendation.fitReason})`);
  }

  return {
    clientId: client.clientId,
    subject: `Case support digest for ${client.fullName}`,
    items,
    selfHelpMaterials: richMaterials ?? null
  };
}

export function buildMbFlag(report) {
  const shouldMonitor = report.monitoringPolicy?.shouldMonitor ?? true;
  if (!shouldMonitor) return null;
  if (report.vendorHealth.health === "good") return null;

  return {
    clientId: report.clientId,
    currentVendorId: report.currentVendor.vendorId,
    issueCategory: "vendor_quality_risk",
    details: report.vendorHealth.issues,
    recommendedVendor: report.recommendation
  };
}

export function buildClientReport(client) {
  const signals = getSignals(client.clientId);
  const caseEnd = detectCaseEnd(signals);
  const vendorHealth = evaluateVendorHealth(signals);
  const monitoringPolicy = deriveMonitoringPolicy(client, caseEnd);
  const recommendation = recommendAlternativeVendor(client, vendorHealth);

  return {
    clientId: client.clientId,
    generatedAt: new Date().toISOString(),
    caseEnd,
    monitoringPolicy,
    currentVendor: client.assignedVendor,
    vendorHealth,
    recommendation
  };
}
