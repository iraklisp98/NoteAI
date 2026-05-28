import {
  assertValidAgentOutput,
  requireString,
  requireStringArray
} from "./agentValidation.js";

const AGENT_NAME = "Intake Agent";

function buildPrompt(dischargeText) {
  return `
You are CAREFLOW's Intake Agent.

Extract high-confidence facts from the discharge note. Preserve uncertainty and do not invent missing data.

Return JSON only with this shape:
{
  "diagnosis": "",
  "medications": [],
  "follow_ups": [],
  "return_precautions": [],
  "home_instructions": [],
  "allergies": [],
  "missing_information": []
}

Discharge note:
${dischargeText}
`.trim();
}

function validateIntakeOutput(output) {
  const errors = [];

  requireString(output?.diagnosis, "diagnosis", errors);
  requireStringArray(output?.medications, "medications", errors);
  requireStringArray(output?.follow_ups, "follow_ups", errors);
  requireStringArray(output?.return_precautions, "return_precautions", errors);
  requireStringArray(output?.home_instructions, "home_instructions", errors);
  requireStringArray(output?.allergies, "allergies", errors);
  requireStringArray(output?.missing_information, "missing_information", errors);
  assertValidAgentOutput(AGENT_NAME, errors);

  return output;
}

export async function runIntakeAgent({ dischargeText, geminiJsonGenerator }) {
  const output = await geminiJsonGenerator({
    prompt: buildPrompt(dischargeText)
  });

  return validateIntakeOutput(output);
}
