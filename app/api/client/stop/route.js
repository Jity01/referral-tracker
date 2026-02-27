import { NextResponse } from "next/server";
import { stopMonitoring } from "../../../../lib/store.js";

export async function POST(request) {
  const body = await request.json();
  if (!body?.clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const updated = stopMonitoring(body.clientId, body.reason);
  if (!updated) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: "Monitoring has been stopped for this client.",
    client: updated
  });
}
