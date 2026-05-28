import { assertValidAgentOutput, requireString } from "./agentValidation.js";

const AGENT_NAME = "Summary Agent";

function buildPrompt({ dischargeText, intake }) {
  return `
You are CAREFLOW's Summary Agent.

Translate the hospital stay into concise, patient-friendly language using only the intake facts.

Return JSON only with this shape:
{
  "title": "",
  "what_happened": "",
  "recovery_goal": ""
}

Intake facts:
${JSON.stringify(intake)}

Discharge note:
${dischargeText}
`.trim();
}

function validateSummaryOutput(output) {
  const errors = [];

  requireString(output?.title, "title", errors);
  requireString(output?.what_happened, "what_happened", errors);
  requireString(output?.recovery_goal, "recovery_goal", errors);
  assertValidAgentOutput(AGENT_NAME, errors);

  return output;
}

export async function runSummaryAgent({ dischargeText, intake, aiJsonGenerator }) {
  const output = await aiJsonGenerator({
    prompt: buildPrompt({ dischargeText, intake })
  });

  return validateSummaryOutput(output);
}
