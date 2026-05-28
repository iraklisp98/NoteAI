import {
  assertValidAgentOutput,
  requireObjectArray,
  requireStringArray
} from "./agentValidation.js";

const AGENT_NAME = "Medication Agent";
const medicationFields = ["name", "dose", "timing", "purpose", "instructions", "caution"];
const todayFields = ["task", "why_it_matters", "source"];

function buildPrompt({ intake }) {
  return `
You are CAREFLOW's Medication Agent.

Build a medication timeline from the intake facts. Do not change dose, timing, or duration. Put unclear medication details in missing_information.

Return JSON only with this shape:
{
  "medications": [
    {
      "name": "",
      "dose": "",
      "timing": "",
      "purpose": "",
      "instructions": "",
      "caution": ""
    }
  ],
  "today": [
    {
      "task": "",
      "why_it_matters": "",
      "source": ""
    }
  ],
  "missing_information": []
}

Intake facts:
${JSON.stringify(intake)}
`.trim();
}

function validateMedicationOutput(output) {
  const errors = [];

  requireObjectArray(output?.medications, medicationFields, "medications", errors);
  requireObjectArray(output?.today, todayFields, "today", errors);
  requireStringArray(output?.missing_information, "missing_information", errors);
  assertValidAgentOutput(AGENT_NAME, errors);

  return output;
}

export async function runMedicationAgent({ intake, geminiJsonGenerator }) {
  const output = await geminiJsonGenerator({
    prompt: buildPrompt({ intake })
  });

  return validateMedicationOutput(output);
}
