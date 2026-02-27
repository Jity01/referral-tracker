#!/usr/bin/env node
/**
 * Tests the reports flow: store, domain, email analyzer.
 * Run: node scripts/test-reports-flow.js
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

import { getClient } from "../lib/store.js";
import { buildClientReport } from "../lib/domain.js";
import { analyzeBothSimulatedCases } from "../lib/email-report-analyzer.js";

function main() {
  console.log("Testing reports flow...\n");

  const case1 = getClient("case-1");
  const case2 = getClient("case-2");

  if (!case1 || !case2) {
    console.error("ERROR: case-1 or case-2 not found. Run: npm run seed:cases");
    process.exit(1);
  }
  console.log("✓ case-1 and case-2 found");

  const report1 = buildClientReport(case1);
  const report2 = buildClientReport(case2);
  console.log("✓ buildClientReport OK");

  const emailAnalysis = analyzeBothSimulatedCases();
  console.log("✓ analyzeBothSimulatedCases OK");

  if (!emailAnalysis.case1 || !emailAnalysis.case2) {
    console.error("ERROR: emailAnalysis missing case1 or case2");
    process.exit(1);
  }

  const required = ["responsiveness", "communicationQuality", "clientSatisfaction", "outcome"];
  for (const k of required) {
    if (!emailAnalysis.case1[k]) console.error(`Case1 missing: ${k}`);
    if (!emailAnalysis.case2[k]) console.error(`Case2 missing: ${k}`);
  }
  console.log("✓ email analysis structure OK");

  console.log("\nCase 1 responsiveness:", emailAnalysis.case1.responsiveness?.score);
  console.log("Case 2 responsiveness:", emailAnalysis.case2.responsiveness?.score);
  console.log("\nAll checks passed.");
}

try {
  main();
} catch (err) {
  console.error("FAILED:", err);
  process.exit(1);
}
