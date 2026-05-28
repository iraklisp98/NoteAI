import { assertValidAgentOutput, requireObjectArray } from "./agentValidation.js";

const AGENT_NAME = "Risk Agent";
const redFlagFields = ["symptom", "action", "urgency"];
const allowedUrgencies = new Set(["emergency_now", "call_today", "monitor"]);

function buildPrompt({ intake }) {
  return `
You are CAREFLOW's Risk Agent.

Turn return precautions into clear escalation guidance. Be conservative and never say emergency care is unnecessary.

Return JSON only with this shape:
{
  "red_flags": [
    {
      "symptom": "",
      "action": "",
      "urgency": "emergency_now | call_today | monitor"
    }
  ]
}

Intake facts:
${JSON.stringify(intake)}
`.trim();
}

function validateRiskOutput(output) {
  const errors = [];

  requireObjectArray(output?.red_flags, redFlagFields, "red_flags", errors);
  if (Array.isArray(output?.red_flags)) {
    output.red_flags.forEach((flag, index) => {
      if (typeof flag?.urgency === "string" && !allowedUrgencies.has(flag.urgency)) {
        errors.push(`red_flags[${index}].urgency must be emergency_now, call_today, or monitor`);
      }
    });
  }
  assertValidAgentOutput(AGENT_NAME, errors);

  return output;
}

export async function runRiskAgent({ intake, geminiJsonGenerator }) {
  const output = await geminiJsonGenerator({
    prompt: buildPrompt({ intake })
  });

  return validateRiskOutput(output);
}
