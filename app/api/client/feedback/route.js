import { NextResponse } from "next/server";
import { buildClientReport } from "../../../../lib/domain.js";
import { addClientFeedback, getClient, getClientFeedback, saveReport } from "../../../../lib/store.js";

const SATISFACTION_BY_SEVERITY = {
  low: 4,
  medium: 2,
  high: 1
};

export async function GET(request) {
  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({
    clientId,
    feedback: getClientFeedback(clientId)
  });
}

export async function POST(request) {
  const body = await request.json();
  if (!body?.clientId || !body?.message) {
    return NextResponse.json({ error: "clientId and message are required." }, { status: 400 });
  }

  const client = getClient(body.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const severity = ["low", "medium", "high"].includes(body.severity) ? body.severity : "medium";
  const feedback = addClientFeedback(body.clientId, {
    message: body.message,
    severity,
    requestedSwitch: Boolean(body.requestedSwitch),
    satisfactionScore: SATISFACTION_BY_SEVERITY[severity]
  });

  const report = buildClientReport(client);
  saveReport(client.clientId, report);

  return NextResponse.json({
    message: "Thanks for your feedback. MB will review this and support next steps.",
    feedback,
    recommendation: report.recommendation
  });
}
