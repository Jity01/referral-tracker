import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const nowIso = () => new Date().toISOString();
const dataDir = resolve(process.cwd(), "data");
const dataFile = resolve(dataDir, "store.json");

function defaultState() {
  return {
    clients: [
      {
        clientId: "client-001",
        fullName: "Casey Smith",
        email: "casey@example.com",
        matterType: "employment",
        relationshipWithVendor: "still_ours",
        assignedVendor: {
          vendorId: "vendor-101",
          name: "Trusted Employment Partners",
          contactName: "Jordan Brown",
          contactEmail: "jordan@trustedemployment.com"
        },
        vendorAlternatives: [
          {
            vendorId: "vendor-102",
            name: "Fair Work Advocates",
            contactName: "Morgan Lee",
            contactEmail: "morgan@fairworkadvocates.com",
            fitReason: "Strong employment specialization with faster reply times."
          }
        ],
        monitoringStopped: false,
        stopReason: null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    signalsByClient: {
      "client-001": [
        { type: "vendor_response_hours", value: 96, at: "2026-02-20T10:00:00.000Z" },
        { type: "client_satisfaction", value: 2, at: "2026-02-21T12:30:00.000Z" },
        { type: "checkin_missed", value: 1, at: "2026-02-22T09:00:00.000Z" }
      ]
    },
    feedbackByClient: {
      "client-001": [
        {
          message: "I would appreciate faster updates from my current vendor.",
          severity: "medium",
          requestedSwitch: false,
          submittedAt: "2026-02-23T10:15:00.000Z"
        }
      ]
    },
    consentByClient: {},
    reportsByClient: {},
    mbFlags: []
  };
}

function normalizeState(state) {
  return {
    clients: state.clients ?? [],
    signalsByClient: state.signalsByClient ?? {},
    feedbackByClient: state.feedbackByClient ?? {},
    consentByClient: state.consentByClient ?? {},
    reportsByClient: state.reportsByClient ?? {},
    mbFlags: state.mbFlags ?? []
  };
}

function ensureDataFile() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify(defaultState(), null, 2), "utf8");
}

function readState() {
  ensureDataFile();
  return normalizeState(JSON.parse(readFileSync(dataFile, "utf8")));
}

function writeState(state) {
  ensureDataFile();
  writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf8");
}

export function listClients() {
  return readState().clients;
}

export function getClient(clientId) {
  return readState().clients.find((client) => client.clientId === clientId) ?? null;
}

export function findClientByEmail(email) {
  const normalized = email.toLowerCase().trim();
  return readState().clients.find((client) => client.email.toLowerCase() === normalized) ?? null;
}

export function provisionClientFromOAuth({ email, fullName }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = findClientByEmail(normalizedEmail);
  if (existing) return existing;

  const state = readState();
  const nextId = `client-${String(state.clients.length + 1).padStart(3, "0")}`;
  const now = nowIso();
  const client = {
    clientId: nextId,
    fullName: fullName?.trim() || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    matterType: "employment",
    relationshipWithVendor: "still_ours",
    assignedVendor: {
      vendorId: "vendor-201",
      name: "MB Preferred Vendor Network",
      contactName: "MB Client Care Team",
      contactEmail: "clientcare@mauriceblackburn.com.au"
    },
    vendorAlternatives: [],
    monitoringStopped: false,
    stopReason: null,
    createdAt: now,
    updatedAt: now
  };

  state.clients.push(client);
  state.signalsByClient[client.clientId] = state.signalsByClient[client.clientId] ?? [];
  state.feedbackByClient[client.clientId] = state.feedbackByClient[client.clientId] ?? [];
  state.consentByClient[client.clientId] = state.consentByClient[client.clientId] ?? [];
  writeState(state);
  return client;
}

export function upsertClientFromMb(payload) {
  const state = readState();
  const existing = state.clients.find((client) => client.clientId === payload.clientId);
  const merged = {
    ...(existing ?? {}),
    ...payload,
    monitoringStopped: existing?.monitoringStopped ?? false,
    stopReason: existing?.stopReason ?? null,
    updatedAt: nowIso(),
    createdAt: existing?.createdAt ?? nowIso()
  };

  state.clients = state.clients.filter((client) => client.clientId !== payload.clientId);
  state.clients.push(merged);
  state.signalsByClient[payload.clientId] = state.signalsByClient[payload.clientId] ?? [];
  writeState(state);
  return merged;
}

export function stopMonitoring(clientId, reason) {
  const state = readState();
  const client = state.clients.find((item) => item.clientId === clientId);
  if (!client) return null;

  client.monitoringStopped = true;
  client.stopReason = reason ?? "client_requested_stop";
  client.updatedAt = nowIso();
  writeState(state);
  return client;
}

export function getSignals(clientId) {
  return readState().signalsByClient[clientId] ?? [];
}

export function setSignals(clientId, signals) {
  const state = readState();
  state.signalsByClient[clientId] = signals;
  writeState(state);
}

export function addSignal(clientId, signal) {
  const state = readState();
  state.signalsByClient[clientId] = state.signalsByClient[clientId] ?? [];
  state.signalsByClient[clientId].push(signal);
  writeState(state);
}

export function getClientFeedback(clientId) {
  const state = readState();
  return state.feedbackByClient[clientId] ?? [];
}

export function addClientFeedback(clientId, feedback) {
  const state = readState();
  state.feedbackByClient[clientId] = state.feedbackByClient[clientId] ?? [];
  const submittedAt = nowIso();
  state.feedbackByClient[clientId].unshift({
    message: feedback.message,
    severity: feedback.severity,
    requestedSwitch: Boolean(feedback.requestedSwitch),
    submittedAt
  });

  if (typeof feedback.satisfactionScore === "number") {
    state.signalsByClient[clientId] = state.signalsByClient[clientId] ?? [];
    state.signalsByClient[clientId].push({
      type: "client_satisfaction",
      value: feedback.satisfactionScore,
      at: submittedAt
    });
  }

  writeState(state);
  return state.feedbackByClient[clientId][0];
}

export function listClientConsents(clientId) {
  const state = readState();
  return state.consentByClient[clientId] ?? [];
}

export function saveClientConsent(clientId, consent) {
  const state = readState();
  state.consentByClient[clientId] = state.consentByClient[clientId] ?? [];
  const createdAt = nowIso();
  state.consentByClient[clientId].unshift({
    provider: consent.provider,
    scopes: consent.scopes ?? [],
    termsVersion: consent.termsVersion,
    notice: consent.notice,
    createdAt
  });
  writeState(state);
  return state.consentByClient[clientId][0];
}

export function saveReport(clientId, report) {
  const state = readState();
  state.reportsByClient[clientId] = report;
  writeState(state);
}

export function getReport(clientId) {
  return readState().reportsByClient[clientId] ?? null;
}

export function pushMbFlag(flag) {
  const state = readState();
  state.mbFlags.unshift({ ...flag, createdAt: nowIso() });
  writeState(state);
}

export function listMbFlags() {
  return readState().mbFlags;
}
