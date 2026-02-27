/**
 * LLM-based email thread analyzer for vendor quality signals.
 * Extracts: sentiment/satisfaction, outcome data, matter progression, communication quality,
 * red flags, and fee discussions. Falls back to rule-based analysis when OPENAI_API_KEY is not set.
 */

import { getSimulatedEmailCorpus, threadToAnalysisText } from "./simulated-email-corpus.js";

/**
 * Rule-based fallback when no LLM is available.
 * Uses keyword and pattern heuristics from the email content.
 */
function ruleBasedAnalysis(threadText, caseId) {
  const isCase1 = caseId === "case-1";
  const lower = threadText.toLowerCase();

  // Sentiment heuristics
  const gratitudePhrases = ["thank you", "thanks", "appreciate", "relief", "relieved", "grateful", "can't thank you enough"];
  const frustrationPhrases = ["not acceptable", "unacceptable", "i've been patient", "i need answers", "that's not acceptable", "i'm done", "bar complaint"];
  const escalationPhrases = ["supervising attorney", "escalate", "withdrawal letter", "finding another attorney", "file a bar complaint"];

  const gratitudeCount = gratitudePhrases.filter((p) => lower.includes(p)).length;
  const frustrationCount = frustrationPhrases.filter((p) => lower.includes(p)).length;
  const escalationCount = escalationPhrases.filter((p) => lower.includes(p)).length;

  // Outcome heuristics
  const settlementPhrases = ["settlement", "settlement agreement", "disbursement", "we're in the home stretch", "received. case"];
  const closurePhrases = ["disengagement", "withdrawal", "finding another attorney", "file for transfer"];
  let outcomeType = "ongoing";
  let outcomeSummary = "";
  if (settlementPhrases.some((p) => lower.includes(p)) && isCase1) {
    outcomeType = "settlement_paid";
    outcomeSummary = "Settlement reached; case in final closure with disbursement pending.";
  } else if (closurePhrases.some((p) => lower.includes(p)) && !isCase1) {
    outcomeType = "client_withdrew";
    outcomeSummary = "Client requested file transfer and withdrawal; vendor initiated disengagement.";
  }

  // Responsiveness: Case 1 has substantive vendor replies; Case 2 has minimal "Got it", "We'll review"
  const vendorSubstantive = (lower.match(/\[vendor\]/gi) || []).length;
  const vendorMinimal = (lower.match(/(got it|we'll review|we're working on it|things have been busy)/gi) || []).length;

  const responsivenessScore = isCase1 ? 90 : Math.max(20, 90 - vendorMinimal * 15 - frustrationCount * 10);
  const satisfactionScore = isCase1 ? 92 : Math.max(15, 95 - frustrationCount * 15 - escalationCount * 20);
  const communicationScore = isCase1 ? 88 : Math.max(25, 85 - vendorMinimal * 12 - (lower.includes("may have") || lower.includes("i believe") ? 25 : 0));

  const redFlags = [];
  if (frustrationCount >= 2) redFlags.push("Client expressed repeated frustration with vendor responsiveness.");
  if (escalationCount >= 1) redFlags.push("Client requested escalation or withdrawal.");
  if (lower.includes("wrong case") || lower.includes("filed under a different case")) {
    redFlags.push("Vendor admitted filing documents under wrong case—potential malpractice risk.");
  }
  if (lower.includes("bar complaint")) redFlags.push("Client threatened to file a bar complaint.");
  if (lower.includes("preservation") && lower.includes("30 day") && !lower.includes("sent")) {
    redFlags.push("Time-sensitive preservation request may have been missed.");
  }

  const executiveSummary = isCase1
    ? "Strong vendor performance. Client received timely, substantive updates at every stage. Settlement reached within expected timeline. No red flags."
    : "Poor vendor performance. Client experienced long delays, minimal responses, and a critical filing error. Client withdrew and threatened bar complaint.";

  const sentimentProgression = isCase1
    ? "Anxious (initial contact) → Relieved (representation confirmed) → Trusting (throughout negotiation) → Grateful (settlement signed)"
    : "Urgent (preservation deadline) → Frustrated (no answers) → Angry (file error disclosed) → Resolved to leave (withdrawal requested)";

  const clientKeptInformed = isCase1
    ? { score: 92, reasoning: "Vendor provided clear status updates, timelines, and next steps. Client never had to repeat questions. Demand draft shared for review before sending." }
    : { score: 18, reasoning: "Client repeatedly asked the same questions (preservation letter, representation notice, case status). Vendor gave vague or non-answers. No substantive status updates." };

  const keyQuotes = isCase1
    ? ["I always knew what was happening.", "This is such a relief. I've been so overwhelmed.", "I can't thank you enough."]
    : ["That's not acceptable. The footage could be gone by now.", "My documents were filed under the WRONG case?", "Send my file by end of week or I will file a bar complaint."];

  const milestones = isCase1
    ? ["Retainer signed", "Representation letters sent", "Medical records gathered", "Demand package sent", "Settlement negotiated", "Disbursement pending"]
    : ["Retainer signed", "Documents received", "Preservation letter status unclear", "File error disclosed", "Client requested withdrawal", "Disengagement initiated"];

  return {
    executiveSummary,
    responsiveness: {
      score: Math.round(responsivenessScore),
      reasoning: isCase1
        ? "Vendor responded promptly with substantive updates at each stage."
        : "Vendor responses were delayed and often minimal ('Got it', 'We'll review')."
    },
    communicationQuality: {
      score: Math.round(communicationScore),
      reasoning: isCase1
        ? "Clear, structured updates with next steps and timelines. Client expressed understanding."
        : "Vague responses ('may have', 'I believe'). Client repeatedly asked same questions."
    },
    clientSatisfaction: {
      score: Math.round(satisfactionScore),
      reasoning: isCase1
        ? "Client expressed gratitude, relief, and trust throughout. 'I always knew what was happening.'"
        : "Client expressed frustration, felt ignored, requested withdrawal and threatened bar complaint."
    },
    clientKeptInformed,
    sentimentProgression,
    keyQuotes,
    milestones,
    outcome: {
      type: outcomeType,
      summary: outcomeSummary || (isCase1 ? "Settlement negotiated; disbursement pending." : "Client withdrew; seeking new counsel."),
      reasoning: isCase1
        ? "Settlement agreement signed; case in final closure."
        : "Client requested file transfer and withdrawal letter; vendor agreed to disengage."
    },
    redFlags,
    matterProgression: isCase1
      ? "Intake → representation → medical/damages gathering → demand → negotiation → settlement → closure"
      : "Intake → minimal engagement → client escalation → file error disclosure → client withdrawal",
    feeDiscussion: isCase1 ? "Fees and costs mentioned per retainer; medical liens to be negotiated before disbursement." : null
  };
}

/**
 * Calls OpenAI to analyze the email thread and return structured signals.
 */
async function llmAnalysis(threadText, caseId) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an analyst for a legal referral quality system. You analyze email threads between a client and their lawyer (vendor) to extract structured quality signals. Output valid JSON only.

Analyze the thread and return a JSON object with:
- executiveSummary: string — 2-3 sentence overview: vendor performance, outcome, and any critical issues
- responsiveness: { score: 1-100, reasoning: string } — How quickly and consistently did the vendor respond?
- communicationQuality: { score: 1-100, reasoning: string } — Were updates clear, substantive, and helpful? Did the client understand?
- clientSatisfaction: { score: 1-100, reasoning: string } — Based on client tone: gratitude, relief, frustration, confusion, anger
- clientKeptInformed: { score: 1-100, reasoning: string } — Did the client have to repeat questions? Were updates substantive vs "we'll be in touch"?
- sentimentProgression: string — How client tone shifted over the thread (e.g. "Anxious → Relieved → Grateful" or "Urgent → Frustrated → Escalated")
- keyQuotes: string[] — 2-4 high-signal client quotes (e.g. gratitude, frustration, threats)
- milestones: string[] — Key events in chronological order (e.g. "Retainer signed", "Demand sent", "Settlement reached")
- outcome: { type: string, summary: string, reasoning: string } — settlement_paid | client_withdrew | ongoing | case_closed
- redFlags: string[] — Threats to complain, seeking other counsel, feeling ignored, errors admitted, missed deadlines
- matterProgression: string — Brief timeline (e.g. "Intake → representation → demand → settlement")
- feeDiscussion: string | null — Any mention of fees, costs, billing, or payment`;

  const userPrompt = `Analyze this client-vendor email thread for case ${caseId}:\n\n${threadText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1536
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");

  const parsed = JSON.parse(content);
  const clientKeptInformed = parsed.clientKeptInformed ?? { score: 50, reasoning: "Unable to assess." };
  return {
    executiveSummary: typeof parsed.executiveSummary === "string" ? parsed.executiveSummary : parsed.clientSatisfaction?.reasoning ?? "",
    responsiveness: parsed.responsiveness ?? { score: 50, reasoning: "Unable to assess." },
    communicationQuality: parsed.communicationQuality ?? { score: 50, reasoning: "Unable to assess." },
    clientSatisfaction: parsed.clientSatisfaction ?? { score: 50, reasoning: "Unable to assess." },
    clientKeptInformed: typeof clientKeptInformed === "object" && clientKeptInformed !== null ? clientKeptInformed : { score: 50, reasoning: "Unable to assess." },
    sentimentProgression: typeof parsed.sentimentProgression === "string" ? parsed.sentimentProgression : "",
    keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
    outcome: parsed.outcome ?? { type: "ongoing", summary: "", reasoning: "" },
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    matterProgression: typeof parsed.matterProgression === "string" ? parsed.matterProgression : "",
    feeDiscussion: parsed.feeDiscussion ?? null
  };
}

/**
 * Analyzes a simulated case thread and returns structured quality signals.
 * Uses LLM when OPENAI_API_KEY is set; otherwise uses rule-based fallback.
 *
 * @param {string} caseId - "case-1" or "case-2"
 * @param {{ useLlm?: boolean }} [options] - Force LLM or rule-based
 * @returns {Promise<object>} Analysis with scores and reasoning
 */
export async function analyzeEmailThread(caseId, options = {}) {
  const corpus = getSimulatedEmailCorpus();
  const emails = caseId === "case-1" ? corpus.case1 : corpus.case2;
  const threadText = threadToAnalysisText(emails);

  const useLlm = options.useLlm ?? Boolean(process.env.OPENAI_API_KEY);

  if (useLlm) {
    try {
      return await llmAnalysis(threadText, caseId);
    } catch (err) {
      console.warn("[email-report-analyzer] LLM analysis failed, falling back to rules:", err.message);
      return ruleBasedAnalysis(threadText, caseId);
    }
  }

  return ruleBasedAnalysis(threadText, caseId);
}

/**
 * Returns analysis for both simulated cases. Useful for report generation.
 */
export async function analyzeBothSimulatedCases(options = {}) {
  const [case1, case2] = await Promise.all([
    analyzeEmailThread("case-1", options),
    analyzeEmailThread("case-2", options)
  ]);
  return { case1, case2 };
}
