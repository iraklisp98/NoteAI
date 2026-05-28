import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export async function buildRecoveryPlan({ text = "", useSample = false } = {}) {
  const trimmedText = typeof text === "string" ? text.trim() : "";
  const warnings = [];

  if (!useSample && !trimmedText) {
    warnings.push("No discharge text was provided, so CAREFLOW returned the sample fallback recovery plan.");
  }

  return {
    plan: await loadFallbackPlan(),
    agents: await loadAgentProgress(),
    warnings,
    source: "fallback"
  };
}
