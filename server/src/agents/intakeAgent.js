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

function stringifyIntakeItem(item) {
  if (typeof item === "string") {
    return item.trim();
  }

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }

  const preferredFields = [
    "name",
    "dose",
    "timing",
    "instructions",
    "instruction",
    "task",
    "timeframe",
    "symptom",
    "action",
    "detail",
    "reason"
  ];
  const values = preferredFields
    .map((field) => item[field])
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());

  return values.length ? values.join(" ") : item;
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map(stringifyIntakeItem) : value;
}

function normalizeIntakeOutput(output) {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return output;
  }

  return {
    ...output,
    medications: normalizeStringArray(output.medications),
    follow_ups: normalizeStringArray(output.follow_ups),
    return_precautions: normalizeStringArray(output.return_precautions),
    home_instructions: normalizeStringArray(output.home_instructions),
    allergies: normalizeStringArray(output.allergies),
    missing_information: normalizeStringArray(output.missing_information)
  };
}

function validateIntakeOutput(output) {
  const normalizedOutput = normalizeIntakeOutput(output);
  const errors = [];

  requireString(normalizedOutput?.diagnosis, "diagnosis", errors);
  requireStringArray(normalizedOutput?.medications, "medications", errors);
  requireStringArray(normalizedOutput?.follow_ups, "follow_ups", errors);
  requireStringArray(normalizedOutput?.return_precautions, "return_precautions", errors);
  requireStringArray(normalizedOutput?.home_instructions, "home_instructions", errors);
  requireStringArray(normalizedOutput?.allergies, "allergies", errors);
  requireStringArray(normalizedOutput?.missing_information, "missing_information", errors);
  assertValidAgentOutput(AGENT_NAME, errors);

  return normalizedOutput;
}

export async function runIntakeAgent({ dischargeText, aiJsonGenerator }) {
  const output = await aiJsonGenerator({
    prompt: buildPrompt(dischargeText)
  });

  return validateIntakeOutput(output);
}
