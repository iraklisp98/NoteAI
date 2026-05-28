import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "../src/services/envLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test(".env.example contains placeholders instead of real API keys", async () => {
  const exampleEnvPath = path.resolve(__dirname, "../../.env.example");
  const exampleEnv = await readFile(exampleEnvPath, "utf8");

  assert.equal(/sk-proj-[A-Za-z0-9_-]{20,}/.test(exampleEnv), false, "OpenAI API key must not be committed");
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(exampleEnv), false, "Gemini API key must not be committed");
});

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
