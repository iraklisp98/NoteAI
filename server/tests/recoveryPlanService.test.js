import assert from "node:assert/strict";
import test from "node:test";

import { buildRecoveryPlan } from "../src/services/recoveryPlanService.js";
import { validateRecoveryPlan } from "../src/services/recoveryPlanValidator.js";

test("returns a validated fallback recovery plan in sample mode", async () => {
  const result = await buildRecoveryPlan({ useSample: true });

  assert.equal(result.source, "fallback");
  assert.equal(result.warnings.length, 0);
  assert.ok(result.agents.length >= 5);
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});

test("falls back safely when no discharge text is provided", async () => {
  const result = await buildRecoveryPlan({ text: "" });

  assert.equal(result.source, "fallback");
  assert.match(result.warnings.join("\n"), /No discharge text/);
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});
