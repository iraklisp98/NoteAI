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

test("uses Gemini output when it returns a valid recovery plan", async () => {
  const geminiPlan = {
    summary: {
      title: "AI generated pneumonia plan",
      what_happened: "The patient was treated for pneumonia.",
      recovery_goal: "Recover safely at home."
    },
    today: [],
    medications: [],
    red_flags: [],
    follow_ups: [],
    questions_for_clinician: [],
    missing_information: [],
    disclaimer: "Prototype only."
  };

  const result = await buildRecoveryPlan({
    text: "Discharge diagnosis: pneumonia",
    geminiJsonGenerator: async () => geminiPlan
  });

  assert.equal(result.source, "gemini");
  assert.equal(result.plan.summary.title, "AI generated pneumonia plan");
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});

test("falls back safely when Gemini returns an invalid recovery plan", async () => {
  const result = await buildRecoveryPlan({
    text: "Discharge diagnosis: pneumonia",
    geminiJsonGenerator: async () => ({
      summary: {
        title: "Invalid plan"
      }
    })
  });

  assert.equal(result.source, "fallback");
  assert.match(result.warnings.join("\n"), /Gemini output was invalid/);
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});

test("preserves likely missing medication dose details when falling back", async () => {
  const result = await buildRecoveryPlan({
    text: "Discharge diagnosis: pneumonia\nDischarge medications:\nAzithromycin by mouth daily.",
    geminiJsonGenerator: async () => {
      throw new Error("offline");
    }
  });

  assert.equal(result.source, "fallback");
  assert.match(result.plan.missing_information.join("\n"), /Azithromycin dose/i);
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});
