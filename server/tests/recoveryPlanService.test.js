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
  const responses = [
    {
      diagnosis: "Pneumonia",
      medications: ["Amoxicillin/clavulanate"],
      follow_ups: ["Primary care in 3-5 days"],
      return_precautions: ["Chest pain"],
      home_instructions: ["Rest and drink fluids"],
      allergies: [],
      missing_information: []
    },
    {
      title: "AI generated pneumonia plan",
      what_happened: "The patient was treated for pneumonia.",
      recovery_goal: "Recover safely at home."
    },
    {
      medications: [
        {
          name: "Amoxicillin/clavulanate",
          dose: "875/125 mg",
          timing: "By mouth twice daily for 5 days",
          purpose: "Antibiotic for pneumonia",
          instructions: "Take exactly as prescribed.",
          caution: "Call the clinician for rash or severe diarrhea."
        }
      ],
      today: [
        {
          task: "Take amoxicillin/clavulanate as prescribed.",
          why_it_matters: "It treats pneumonia.",
          source: "Medication Agent"
        }
      ],
      missing_information: []
    },
    {
      red_flags: [
        {
          symptom: "Chest pain",
          action: "Seek emergency care now.",
          urgency: "emergency_now"
        }
      ]
    },
    {
      today: [
        {
          task: "Rest and drink fluids.",
          why_it_matters: "It supports recovery.",
          source: "Education Agent"
        }
      ],
      follow_ups: [
        {
          task: "Primary care follow-up",
          timeframe: "In 3-5 days",
          reason: "Review pneumonia recovery."
        }
      ],
      questions_for_clinician: ["When can normal activity resume?"],
      missing_information: []
    }
  ];
  const prompts = [];

  const result = await buildRecoveryPlan({
    text: "Discharge diagnosis: pneumonia",
    geminiJsonGenerator: async ({ prompt }) => {
      prompts.push(prompt);
      return responses[prompts.length - 1];
    }
  });

  assert.equal(result.source, "gemini");
  assert.equal(result.plan.summary.title, "AI generated pneumonia plan");
  assert.equal(result.plan.medications[0].name, "Amoxicillin/clavulanate");
  assert.equal(result.plan.red_flags[0].urgency, "emergency_now");
  assert.equal(result.plan.follow_ups[0].timeframe, "In 3-5 days");
  assert.equal(result.plan.today.length, 2);
  assert.deepEqual(
    prompts.map((prompt) => prompt.match(/You are CAREFLOW's (.*?)\./)?.[1]),
    ["Intake Agent", "Summary Agent", "Medication Agent", "Risk Agent", "Education Agent"]
  );
  assert.equal(validateRecoveryPlan(result.plan).valid, true);
});

test("agent files export separate pipeline functions", async () => {
  const [
    intakeAgent,
    summaryAgent,
    medicationAgent,
    riskAgent,
    educationAgent,
    composeRecoveryPlan
  ] = await Promise.all([
    import("../src/agents/intakeAgent.js"),
    import("../src/agents/summaryAgent.js"),
    import("../src/agents/medicationAgent.js"),
    import("../src/agents/riskAgent.js"),
    import("../src/agents/educationAgent.js"),
    import("../src/agents/composeRecoveryPlan.js")
  ]);

  assert.equal(typeof intakeAgent.runIntakeAgent, "function");
  assert.equal(typeof summaryAgent.runSummaryAgent, "function");
  assert.equal(typeof medicationAgent.runMedicationAgent, "function");
  assert.equal(typeof riskAgent.runRiskAgent, "function");
  assert.equal(typeof educationAgent.runEducationAgent, "function");
  assert.equal(typeof composeRecoveryPlan.composeRecoveryPlan, "function");
});

test("falls back safely when Gemini returns an invalid recovery plan", async () => {
  const invalidIntake = {
    summary: {
      title: "Invalid plan"
    }
  };

  const result = await buildRecoveryPlan({
    text: "Discharge diagnosis: pneumonia",
    geminiJsonGenerator: async () => invalidIntake
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
