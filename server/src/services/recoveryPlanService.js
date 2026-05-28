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
const agentProgressPath = path.join(repoRoot, "shared/agentProgress.json");
const sampleNotePath = path.join(repoRoot, "shared/sampleDischargeNote.txt");

export class RecoveryPlanGenerationError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "RecoveryPlanGenerationError";
    this.code = code;
    this.cause = cause;
  }
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function loadAgentProgress() {
  const agents = await readJson(agentProgressPath);

  return agents.map((agent) => ({
    name: agent.name,
    status: "complete",
    summary: agent.summary
  }));
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
  const providedText = typeof text === "string" ? text.trim() : "";
  const trimmedText = providedText || (useSample ? (await readFile(sampleNotePath, "utf8")).trim() : "");

  if (!trimmedText) {
    throw new RecoveryPlanGenerationError(
      "RECOVERY_TEXT_REQUIRED",
      "Discharge text is required before the live recovery-plan agents can run."
    );
  }

  let plan;
  try {
    plan = await runRecoveryAgentPipeline({
      dischargeText: trimmedText,
      geminiJsonGenerator
    });
  } catch (error) {
    if (error instanceof AgentOutputValidationError) {
      throw new RecoveryPlanGenerationError(
        "RECOVERY_AGENT_OUTPUT_INVALID",
        error.message,
        error
      );
    }

    throw new RecoveryPlanGenerationError(
      "RECOVERY_AGENT_GENERATION_FAILED",
      `The live Gemini recovery-plan agents could not generate a plan. ${error instanceof Error ? error.message : "Unknown error."}`,
      error
    );
  }

  const validation = validateRecoveryPlan(plan);

  if (!validation.valid) {
    throw new RecoveryPlanGenerationError(
      "RECOVERY_PLAN_INVALID",
      `The live Gemini recovery-plan agents returned an invalid plan. ${validation.errors.join("; ")}`
    );
  }

  return {
    plan,
    agents: await loadAgentProgress(),
    warnings: [],
    source: "gemini"
  };
}
