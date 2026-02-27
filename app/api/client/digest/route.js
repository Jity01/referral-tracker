import { NextResponse } from "next/server";
import { buildClientReport, buildDigest } from "../../../../lib/domain.js";
import { getClient } from "../../../../lib/store.js";

export async function GET(request) {
  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const report = buildClientReport(client);
  return NextResponse.json(buildDigest(client, report));
}
