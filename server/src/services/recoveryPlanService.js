import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateJsonWithGemini } from "./geminiClient.js";
import { validateRecoveryPlan } from "./recoveryPlanValidator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const fallbackPlanPath = path.join(repoRoot, "shared/sampleRecoveryPlan.json");
const agentProgressPath = path.join(repoRoot, "shared/agentProgress.json");

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function loadFallbackPlan() {
  const plan = await readJson(fallbackPlanPath);
  const validation = validateRecoveryPlan(plan);

  if (!validation.valid) {
    throw new Error(`Fallback recovery plan is invalid: ${validation.errors.join("; ")}`);
  }

  return plan;
}

async function loadAgentProgress() {
  const agents = await readJson(agentProgressPath);

  return agents.map((agent) => ({
    name: agent.name,
    status: "complete",
    summary: agent.summary
  }));
}

function findLikelyMedicationDoseGaps(dischargeText) {
  const lines = dischargeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dosePattern = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|units?|puffs?|tablets?|capsules?)\b/i;
  const medicationCue = /(?:medication|medications|take|tablet|capsule|inhaler|by mouth|daily|twice daily|every \d+)/i;

  return lines.flatMap((line) => {
    if (!medicationCue.test(line) || dosePattern.test(line) || /discharge medications?:?$/i.test(line)) {
      return [];
    }

    const match = line.match(/^(?:\d+[.)]?\s*)?([A-Z][A-Za-z0-9/-]+)/);
    if (!match) {
      return [];
    }

    return [`${match[1]} dose was not clearly listed in the discharge text.`];
  });
}

function mergeMissingInformation(plan, additions) {
  if (additions.length === 0) {
    return plan;
  }

  return {
    ...plan,
    missing_information: [...new Set([...plan.missing_information, ...additions])]
  };
}

function buildRecoveryPlanPrompt(dischargeText) {
  return `
You are CAREFLOW's recovery-plan backend pipeline.

Convert the discharge note into strict JSON matching this exact shape:
{
  "summary": {
    "title": "",
    "what_happened": "",
    "recovery_goal": ""
  },
  "today": [
    {
      "task": "",
      "why_it_matters": "",
      "source": ""
    }
  ],
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
  "red_flags": [
    {
      "symptom": "",
      "action": "",
      "urgency": "emergency_now | call_today | monitor"
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
  "missing_information": [],
  "disclaimer": ""
}

Rules:
- Return JSON only.
- Do not diagnose new conditions.
- Do not change medication dose, timing, or duration.
- Do not invent missing details.
- Put missing or ambiguous details in missing_information.
- Use patient-friendly language.
- Include this disclaimer exactly: CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.

Discharge note:
${dischargeText}
`.trim();
}

export async function buildRecoveryPlan({
  text = "",
  useSample = false,
  geminiJsonGenerator = generateJsonWithGemini
} = {}) {
  const trimmedText = typeof text === "string" ? text.trim() : "";
  const warnings = [];
  const missingInformationAdditions = findLikelyMedicationDoseGaps(trimmedText);

  if (!useSample && !trimmedText) {
    warnings.push("No discharge text was provided, so CAREFLOW returned the sample fallback recovery plan.");
  } else if (!useSample) {
    try {
      const plan = await geminiJsonGenerator({
        prompt: buildRecoveryPlanPrompt(trimmedText)
      });
      const validation = validateRecoveryPlan(plan);

      if (validation.valid) {
        return {
          plan: mergeMissingInformation(plan, missingInformationAdditions),
          agents: await loadAgentProgress(),
          warnings,
          source: "gemini"
        };
      }

      warnings.push(`Gemini output was invalid, so CAREFLOW returned the sample fallback recovery plan. ${validation.errors.join("; ")}`);
    } catch (error) {
      warnings.push(
        `Gemini generation failed, so CAREFLOW returned the sample fallback recovery plan. ${
          error instanceof Error ? error.message : "Unknown error."
        }`
      );
    }
  }

  return {
    plan: mergeMissingInformation(await loadFallbackPlan(), missingInformationAdditions),
    agents: await loadAgentProgress(),
    warnings,
    source: "fallback"
  };
}
