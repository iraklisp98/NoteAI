import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AgentOutputValidationError } from "../agents/agentValidation.js";
import { composeRecoveryPlan } from "../agents/composeRecoveryPlan.js";
import { runEducationAgent } from "../agents/educationAgent.js";
import { runIntakeAgent } from "../agents/intakeAgent.js";
import { runMedicationAgent } from "../agents/medicationAgent.js";
import { runRiskAgent } from "../agents/riskAgent.js";
import { runSummaryAgent } from "../agents/summaryAgent.js";
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

async function runRecoveryAgentPipeline({ dischargeText, geminiJsonGenerator }) {
  const intake = await runIntakeAgent({ dischargeText, geminiJsonGenerator });
  const summary = await runSummaryAgent({ dischargeText, intake, geminiJsonGenerator });
  const medication = await runMedicationAgent({ intake, geminiJsonGenerator });
  const risk = await runRiskAgent({ intake, geminiJsonGenerator });
  const education = await runEducationAgent({
    intake,
    summary,
    medications: medication.medications,
    redFlags: risk.red_flags,
    geminiJsonGenerator
  });

  return composeRecoveryPlan({ intake, summary, medication, risk, education });
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
      const plan = await runRecoveryAgentPipeline({
        dischargeText: trimmedText,
        geminiJsonGenerator
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
      if (error instanceof AgentOutputValidationError) {
        warnings.push(`Gemini output was invalid, so CAREFLOW returned the sample fallback recovery plan. ${error.message}`);
      } else {
        warnings.push(
          `Gemini generation failed, so CAREFLOW returned the sample fallback recovery plan. ${
            error instanceof Error ? error.message : "Unknown error."
          }`
        );
      }
    }
  }

  return {
    plan: mergeMissingInformation(await loadFallbackPlan(), missingInformationAdditions),
    agents: await loadAgentProgress(),
    warnings,
    source: "fallback"
  };
}
