import { NextResponse } from "next/server";
import { buildClientReport, buildDigest, buildMbFlag } from "../../../../lib/domain.js";
import { listClients, pushMbFlag, saveReport } from "../../../../lib/store.js";

async function runCycle() {
  const reports = [];
  for (const client of listClients()) {
    const report = buildClientReport(client);
    saveReport(client.clientId, report);

    const digest = buildDigest(client, report);
    const mbFlag = buildMbFlag(report);
    if (mbFlag) {
      pushMbFlag(mbFlag);
    }

    reports.push({
      clientId: client.clientId,
      monitoringPolicy: report.monitoringPolicy,
      vendorHealth: report.vendorHealth,
      digest,
      mbFlagGenerated: Boolean(mbFlag)
    });
  }

  return NextResponse.json({
    message: "Monitoring cycle completed.",
    reports
  });
}

export async function POST() {
  return runCycle();
}

export async function GET() {
  return runCycle();
}
