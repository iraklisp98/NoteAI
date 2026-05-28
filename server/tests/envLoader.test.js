import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadEnvFile } from "../src/services/envLoader.js";

test("loads missing environment variables from a .env file without overwriting existing values", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "careflow-env-"));
  const envPath = path.join(tempDir, ".env");
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  try {
    process.env.GEMINI_API_KEY = "already-set";
    delete process.env.GEMINI_MODEL;
    await writeFile(envPath, "GEMINI_API_KEY=from-file\nGEMINI_MODEL=gemini-test\n");

    const result = await loadEnvFile(envPath);

    assert.equal(result.loaded, true);
    assert.equal(process.env.GEMINI_API_KEY, "already-set");
    assert.equal(process.env.GEMINI_MODEL, "gemini-test");
  } finally {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }

    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }

    await rm(tempDir, { recursive: true, force: true });
  }
});
