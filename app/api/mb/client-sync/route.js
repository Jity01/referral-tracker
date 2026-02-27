import { NextResponse } from "next/server";
import { upsertClientFromMb } from "../../../../lib/store.js";

export async function POST(request) {
  const payload = await request.json();
  if (!payload?.clientId || !payload?.assignedVendor) {
    return NextResponse.json(
      { error: "clientId and assignedVendor are required for MB->client sync." },
      { status: 400 }
    );
  }

  const client = upsertClientFromMb(payload);
  return NextResponse.json({
    message: "Client profile synced from MB side.",
    client
  });
}
