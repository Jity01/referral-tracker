#!/usr/bin/env node

/**
 * Seeds the store with two simulated PI cases (case 1 = good vendor, case 2 = bad vendor)
 * so reports can be generated and displayed on the platform.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dataDir = resolve(process.cwd(), "data");
const dataFile = resolve(dataDir, "store.json");

const nowIso = () => new Date().toISOString();

const case1Client = {
  clientId: "case-1",
  fullName: "Marcus",
  email: "case1.demo@example.com",
  matterType: "personal_injury",
  matterSubtype: "car_accident",
  relationshipWithVendor: "still_ours",
  assignedVendor: {
    vendorId: "vendor-chen-associates",
    name: "Chen & Associates Injury Law",
    contactName: "Sarah Chen",
    contactEmail: "sarah@chenassociates.com"
  },
  vendorAlternatives: [],
  monitoringStopped: false,
  stopReason: null,
  createdAt: nowIso(),
  updatedAt: nowIso()
};

const case2Client = {
  clientId: "case-2",
  fullName: "Diana",
  email: "case2.demo@example.com",
  matterType: "personal_injury",
  matterSubtype: "slip_and_fall",
  relationshipWithVendor: "still_ours",
  assignedVendor: {
    vendorId: "vendor-metro-injury",
    name: "Metro Injury Law",
    contactName: "Marcus",
    contactEmail: "marcus@metroinjurylaw.com"
  },
  vendorAlternatives: [
    {
      vendorId: "vendor-swift-advocates",
      name: "Swift Injury Advocates",
      contactName: "Alex Chen",
      contactEmail: "alex@swiftinjury.com",
      fitReason: "Faster response times and stronger client communication track record."
    }
  ],
  monitoringStopped: false,
  stopReason: null,
  createdAt: nowIso(),
  updatedAt: nowIso()
};

const case1Signals = [
  { type: "vendor_response_hours", value: 18, at: "2026-02-20T10:00:00.000Z" },
  { type: "vendor_response_hours", value: 24, at: "2026-02-21T14:00:00.000Z" },
  { type: "vendor_response_hours", value: 12, at: "2026-02-22T09:00:00.000Z" },
  { type: "client_satisfaction", value: 5, at: "2026-02-23T11:00:00.000Z" },
  { type: "client_satisfaction", value: 5, at: "2026-02-25T16:00:00.000Z" },
  { type: "settlement_paid", value: 1, at: "2026-02-27T08:00:00.000Z" }
];

const case2Signals = [
  { type: "vendor_response_hours", value: 168, at: "2026-02-18T10:00:00.000Z" },
  { type: "vendor_response_hours", value: 120, at: "2026-02-20T14:00:00.000Z" },
  { type: "vendor_response_hours", value: 144, at: "2026-02-22T09:00:00.000Z" },
  { type: "client_satisfaction", value: 2, at: "2026-02-24T11:00:00.000Z" },
  { type: "client_satisfaction", value: 1, at: "2026-02-26T16:00:00.000Z" },
  { type: "checkin_missed", value: 2, at: "2026-02-25T09:00:00.000Z" },
  { type: "case_closed", value: 1, at: "2026-02-27T08:00:00.000Z" }
];

function ensureDataFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    writeFileSync(
      dataFile,
      JSON.stringify(
        {
          clients: [],
          signalsByClient: {},
          feedbackByClient: {},
          consentByClient: {},
          reportsByClient: {},
          mbFlags: []
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readState() {
  ensureDataFile();
  return JSON.parse(readFileSync(dataFile, "utf8"));
}

function writeState(state) {
  ensureDataFile();
  writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf8");
}

function seed() {
  const state = readState();

  const existingCase1 = state.clients.find((c) => c.clientId === "case-1");
  const existingCase2 = state.clients.find((c) => c.clientId === "case-2");

  if (!existingCase1) {
    state.clients.push(case1Client);
    console.log("Added case-1 client (Marcus - car accident, Chen & Associates)");
  } else {
    Object.assign(existingCase1, case1Client);
    existingCase1.updatedAt = nowIso();
    console.log("Updated case-1 client");
  }

  if (!existingCase2) {
    state.clients.push(case2Client);
    console.log("Added case-2 client (Diana - slip and fall, Metro Injury Law)");
  } else {
    Object.assign(existingCase2, case2Client);
    existingCase2.updatedAt = nowIso();
    console.log("Updated case-2 client");
  }

  state.signalsByClient["case-1"] = case1Signals;
  state.signalsByClient["case-2"] = case2Signals;
  state.feedbackByClient["case-1"] = state.feedbackByClient["case-1"] ?? [];
  state.feedbackByClient["case-2"] = state.feedbackByClient["case-2"] ?? [];
  state.consentByClient["case-1"] = state.consentByClient["case-1"] ?? [];
  state.consentByClient["case-2"] = state.consentByClient["case-2"] ?? [];

  writeState(state);
  console.log("Seeded signals for case-1 and case-2.");
  console.log("Run the app and visit /reports to view both case reports.");
}

seed();
