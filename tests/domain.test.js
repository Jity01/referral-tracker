import test from "node:test";
import assert from "node:assert/strict";
import {
  detectCaseEnd,
  evaluateVendorHealth,
  deriveMonitoringPolicy,
  buildDigest,
  buildMbFlag
} from "../lib/domain.js";

test("detectCaseEnd returns true for explicit resolution signal", () => {
  const result = detectCaseEnd([{ type: "case_closed", value: 1 }]);
  assert.equal(result.ended, true);
  assert.equal(result.confidence, 0.95);
});

test("evaluateVendorHealth marks poor for slow response and low satisfaction", () => {
  const result = evaluateVendorHealth([
    { type: "vendor_response_hours", value: 95 },
    { type: "client_satisfaction", value: 2 }
  ]);
  assert.equal(result.health, "poor");
});

test("deriveMonitoringPolicy is strict when relationship transferred", () => {
  const result = deriveMonitoringPolicy(
    { monitoringStopped: false, relationshipWithVendor: "transferred" },
    { ended: false, reason: "n/a" }
  );
  assert.equal(result.shouldMonitor, true);
  assert.equal(result.strictness, "strict");
});

test("buildDigest includes redirect item when recommendation exists", () => {
  const digest = buildDigest(
    { clientId: "client-1", fullName: "A", matterType: "employment" },
    { recommendation: { name: "New Vendor", fitReason: "Better fit" } }
  );
  assert.ok(digest.items.some((item) => item.includes("Redirect option")));
});

test("buildMbFlag emits payload for non-good vendor health", () => {
  const flag = buildMbFlag({
    clientId: "client-1",
    currentVendor: { vendorId: "vendor-1" },
    vendorHealth: { health: "poor", issues: ["Low satisfaction"] },
    recommendation: { vendorId: "vendor-2" }
  });
  assert.equal(flag.issueCategory, "vendor_quality_risk");
});
