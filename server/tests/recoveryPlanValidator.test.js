import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateRecoveryPlan } from "../src/services/recoveryPlanValidator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

async function readJson(relativePath) {
  const content = await readFile(path.join(repoRoot, relativePath), "utf8");
  return JSON.parse(content);
}

test("validates the shared sample recovery plan", async () => {
  const plan = await readJson("shared/sampleRecoveryPlan.json");

  const result = validateRecoveryPlan(plan);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("rejects a recovery plan missing required sections", () => {
  const result = validateRecoveryPlan({
    summary: {
      title: "Recovering at home",
      what_happened: "A short summary",
      recovery_goal: "Recover safely"
    }
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /today/);
  assert.match(result.errors.join("\n"), /medications/);
});
