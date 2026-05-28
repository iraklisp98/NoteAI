import {
  assertValidAgentOutput,
  requireObjectArray,
  requireStringArray
} from "./agentValidation.js";

const AGENT_NAME = "Education Agent";
const todayFields = ["task", "why_it_matters", "source"];
const followUpFields = ["task", "timeframe", "reason"];

function buildPrompt({ intake, summary, medications, redFlags }) {
  return `
You are CAREFLOW's Education Agent.

Convert supported discharge instructions into practical patient tasks, follow-ups, and questions for the clinician.

Return JSON only with this shape:
{
  "today": [
    {
      "task": "",
      "why_it_matters": "",
      "source": ""
    }
  ],
  "follow_ups": [
    {
      "task": "",
      "timeframe": "",
      "reason": ""
    }
  ],
  "questions_for_clinician": [],
  "missing_information": []
}

Intake facts:
${JSON.stringify(intake)}

Summary:
${JSON.stringify(summary)}

Medications:
${JSON.stringify(medications)}

Red flags:
${JSON.stringify(redFlags)}
`.trim();
}

function validateEducationOutput(output) {
  const errors = [];

  requireObjectArray(output?.today, todayFields, "today", errors);
  requireObjectArray(output?.follow_ups, followUpFields, "follow_ups", errors);
  requireStringArray(output?.questions_for_clinician, "questions_for_clinician", errors);
  requireStringArray(output?.missing_information, "missing_information", errors);
  assertValidAgentOutput(AGENT_NAME, errors);

  return output;
}

export async function runEducationAgent({ intake, summary, medications, redFlags, aiJsonGenerator }) {
  const output = await aiJsonGenerator({
    prompt: buildPrompt({ intake, summary, medications, redFlags })
  });

  return validateEducationOutput(output);
}
