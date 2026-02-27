/**
 * Static rule-based email thread analyzer for vendor quality signals.
 * Pre-generated analysis for demo—no LLM, same output every time.
 */

function analyzeCase(caseId) {
  const isCase1 = caseId === "case-1";
  // Case 2 has: frustration, escalation, minimal vendor replies, file error, bar complaint
  const frustrationCount = isCase1 ? 0 : 4;
  const escalationCount = isCase1 ? 0 : 2;
  const vendorMinimal = isCase1 ? 0 : 4;

  const responsivenessScore = isCase1 ? 90 : Math.max(20, 90 - vendorMinimal * 15 - frustrationCount * 10);
  const satisfactionScore = isCase1 ? 92 : Math.max(15, 95 - frustrationCount * 15 - escalationCount * 20);
  const communicationScore = isCase1 ? 88 : Math.max(25, 85 - vendorMinimal * 12 - 25);

  const outcomeType = isCase1 ? "settlement_paid" : "client_withdrew";
  const outcomeSummary = isCase1
    ? "Settlement reached; case in final closure with disbursement pending."
    : "Client requested file transfer and withdrawal; vendor initiated disengagement.";

  const redFlags = isCase1
    ? []
    : [
        "Client expressed repeated frustration with vendor responsiveness.",
        "Client requested escalation or withdrawal.",
        "Vendor admitted filing documents under wrong case—potential malpractice risk.",
        "Client threatened to file a bar complaint.",
        "Time-sensitive preservation request may have been missed."
      ];

  return {
    executiveSummary: isCase1
      ? "Strong vendor performance. Client received timely, substantive updates at every stage. Settlement reached within expected timeline. No red flags."
      : "Poor vendor performance. Client experienced long delays, minimal responses, and a critical filing error. Client withdrew and threatened bar complaint.",
    clientEngagement: isCase1
      ? {
          score: 95,
          definition: "Whether the client actively participated after handoff: replied promptly, provided requested documents, asked relevant questions, and followed through on next steps.",
          reasoning:
            "Client engaged immediately after initial contact. Provided accident details, police report, medical records, and signed retainer within days. Sent MRI results, pay stubs, employer letter, and receipts as requested. Asked clarifying questions and responded to vendor updates. Participated in demand review before sending. No drop-off or disengagement at any stage."
        }
      : {
          score: 85,
          definition: "Whether the client actively participated after handoff: replied promptly, provided requested documents, asked relevant questions, and followed through on next steps.",
          reasoning:
            "Client engaged strongly at intake—sent retainer, incident report, medical records, photos, and witness details. Flagged urgent preservation deadline. Continued to follow up when vendor went silent. Engagement remained high despite poor vendor response; client's persistence (asking same questions repeatedly) reflects engagement, not disengagement. Ultimately disengaged by requesting withdrawal due to vendor failures."
        },
    responsiveness: {
      score: Math.round(responsivenessScore),
      definition: "How quickly and consistently the vendor replied to client messages.",
      reasoning: isCase1
        ? "Vendor responded promptly with substantive updates at each stage. No long gaps; client received acknowledgment and next steps within 1–2 days of each message."
        : "Vendor responses were delayed (often 5–7 days) and often minimal ('Got it', 'We'll review', 'We're working on it'). Client waited over a week for answers to urgent questions."
    },
    communicationQuality: {
      score: Math.round(communicationScore),
      definition: "Whether vendor updates were clear, substantive, and helped the client understand progress.",
      reasoning: isCase1
        ? "Clear, structured updates with next steps and timelines. Client expressed understanding. No repeated questions; each update built on the last."
        : "Vague responses ('may have', 'I believe'). Client repeatedly asked the same questions. No substantive status updates; vendor could not confirm basic facts about the case."
    },
    clientSatisfaction: {
      score: Math.round(satisfactionScore),
      definition: "Client sentiment inferred from correspondence: gratitude, relief, trust vs. frustration, confusion, anger.",
      reasoning: isCase1
        ? "Client expressed gratitude, relief, and trust throughout. Key quote: 'I always knew what was happening.' Ended with 'I can't thank you enough.'"
        : "Client expressed frustration, felt ignored, requested withdrawal and threatened bar complaint. Tone escalated from urgent to angry over the thread."
    },
    clientKeptInformed: {
      score: isCase1 ? 92 : 18,
      definition: "Whether the client had to repeat questions or received substantive updates vs. boilerplate 'we'll be in touch.'",
      reasoning: isCase1
        ? "Vendor provided clear status updates, timelines, and next steps. Client never had to repeat questions. Demand draft shared for review before sending."
        : "Client repeatedly asked the same questions (preservation letter, representation notice, case status). Vendor gave vague or non-answers. No substantive status updates."
    },
    outcome: {
      type: outcomeType,
      summary: outcomeSummary || (isCase1 ? "Settlement negotiated; disbursement pending." : "Client withdrew; seeking new counsel."),
      definition: "How the matter concluded: settlement, closure, client withdrawal, or ongoing.",
      reasoning: isCase1
        ? "Settlement agreement signed; case in final closure. Medical liens to be negotiated before disbursement. Client expressed satisfaction with outcome."
        : "Client requested file transfer and withdrawal letter; vendor agreed to disengage. No settlement; client seeking new counsel. Key evidence (surveillance) may have been lost due to vendor delay."
    },
    sentimentProgression: isCase1
      ? "Anxious (initial contact) → Relieved (representation confirmed) → Trusting (throughout negotiation) → Grateful (settlement signed)"
      : "Urgent (preservation deadline) → Frustrated (no answers) → Angry (file error disclosed) → Resolved to leave (withdrawal requested)",
    keyQuotes: isCase1
      ? ["I always knew what was happening.", "This is such a relief. I've been so overwhelmed.", "I can't thank you enough."]
      : ["That's not acceptable. The footage could be gone by now.", "My documents were filed under the WRONG case?", "Send my file by end of week or I will file a bar complaint."],
    milestones: isCase1
      ? ["Retainer signed", "Representation letters sent", "Medical records gathered", "Demand package sent", "Settlement negotiated", "Disbursement pending"]
      : ["Retainer signed", "Documents received", "Preservation letter status unclear", "File error disclosed", "Client requested withdrawal", "Disengagement initiated"],
    caseLifecycleNarrative: isCase1
      ? `Client Marcus contacted the firm two weeks after a rear-end collision. He had been to the ER and was seeing a physical therapist; the at-fault insurer had been calling and he was unsure how to respond. The vendor (Sarah Chen) replied within a day with a clear intake plan and representation strategy. Marcus signed the retainer and provided accident details, police report number, and medical provider names. He had not given any statement to insurance—a critical protective step the vendor acknowledged. Over the following weeks, Marcus sent MRI results (L4-L5 disc bulge), pay stubs, employer letter, and receipts. The vendor sent representation letters, gathered medical records, and built the demand. When the insurer tried to contact Marcus directly, he forwarded the letter and the vendor instructed him not to respond. The demand package was shared for his review before sending. After negotiation, a settlement was reached within the target range. Marcus signed the agreement and expressed gratitude: "I always knew what was happening." The case is in final closure with disbursement pending.`
      : `Client Diana contacted the firm three weeks after a slip-and-fall at a grocery store. She had broken her wrist, undergone surgery, and was struggling with the store's insurer. She sent the retainer, incident report, medical records, photos, and witness details. She urgently requested a preservation letter for surveillance footage, noting the 30-day deletion window. The vendor (Marcus) replied briefly: "Got it. We'll review." Over a week passed with no update. Diana asked whether the preservation letter had been sent and whether the insurer had been notified. The vendor replied: "We're working on it. Things have been busy." Diana escalated: the footage could be gone; she needed answers. The vendor said he would check the files—there may have been a mix-up with the matter number. Diana asked directly: was a preservation letter sent? The vendor said documents may have been filed under a different case. Diana requested her file and a withdrawal letter. The vendor agreed to disengage. Diana threatened a bar complaint if her file was not sent within 48 hours.`,
    notableEvents: isCase1
      ? [
          { event: "Client declined to give insurer statement before representation", significance: "Protected case value; showed client followed vendor guidance." },
          { event: "Demand draft shared for client review before sending", significance: "Transparency and client involvement in key decision." },
          { event: "Settlement reached within target range after negotiation", significance: "Successful outcome; client expressed strong satisfaction." }
        ]
      : [
          { event: "Client flagged 30-day surveillance preservation deadline", significance: "Time-sensitive; vendor did not act promptly." },
          { event: "Vendor admitted possible file mix-up and wrong-case filing", significance: "Serious administrative error; potential malpractice risk." },
          { event: "Client requested withdrawal and threatened bar complaint", significance: "Relationship breakdown; regulatory risk for vendor." }
        ],
    redFlags,
    matterProgression: isCase1
      ? "Intake → representation → medical/damages gathering → demand → negotiation → settlement → closure"
      : "Intake → minimal engagement → client escalation → file error disclosure → client withdrawal",
    feeDiscussion: isCase1 ? "Fees and costs mentioned per retainer; medical liens to be negotiated before disbursement." : null
  };
}

/** Pre-computed static analysis for both demo cases. Same output every time. */
const STATIC_ANALYSIS = {
  case1: analyzeCase("case-1"),
  case2: analyzeCase("case-2")
};

/**
 * Returns analysis for both simulated cases. Static—no LLM, no API calls.
 */
export function analyzeBothSimulatedCases() {
  return STATIC_ANALYSIS;
}

/**
 * Returns analysis for a single case. Static—no LLM, no API calls.
 */
export function analyzeEmailThread(caseId) {
  return STATIC_ANALYSIS[caseId === "case-1" ? "case1" : "case2"] ?? analyzeCase(caseId);
}
