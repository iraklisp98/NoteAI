import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadEnvFile } from "../src/services/envLoader.js";

test("loads missing environment variables from an env file", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "careflow-env-"));
  const envPath = path.join(directory, ".env");
  const previousApiKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;

  delete process.env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL = "already-set";

  try {
    await writeFile(
      envPath,
      [
        "GEMINI_API_KEY=test-key",
        "GEMINI_MODEL=from-file",
        "IGNORED_LINE",
        "SERVER_PORT=3001"
      ].join("\n"),
      "utf8"
    );

    const loaded = await loadEnvFile(envPath);

    assert.equal(loaded, true);
    assert.equal(process.env.GEMINI_API_KEY, "test-key");
    assert.equal(process.env.GEMINI_MODEL, "already-set");
    assert.equal(process.env.SERVER_PORT, "3001");
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousApiKey;
    }

    if (previousModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = previousModel;
    }

    delete process.env.SERVER_PORT;
    await rm(directory, { recursive: true, force: true });
  }
});
