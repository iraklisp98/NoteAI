import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePlan = JSON.parse(readFileSync(path.join(__dirname, "../../shared/sampleRecoveryPlan.json"), "utf8"));

async function postJson(server, path, body) {
  const listener = server.listen(0);
  await new Promise((resolve) => listener.once("listening", resolve));
  const { port } = listener.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
    await new Promise((resolve, reject) => {
      listener.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/chat requires the live Conversation Agent for non-emergency questions", async () => {
  const response = await postJson(createServer(), "/api/chat", {
    question: "Can I take ibuprofen with these medications?",
    plan: samplePlan
  });

  assert.equal(response.status, 502);
  assert.equal(response.body.error, "CHAT_AGENT_GENERATION_FAILED");
  assert.match(response.body.message, /live Gemini/i);
});
