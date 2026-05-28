import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../src/index.js";

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

test("POST /api/recovery-plan returns a valid fallback plan", async () => {
  const response = await postJson(createServer(), "/api/recovery-plan", { useSample: true });

  assert.equal(response.status, 200);
  assert.equal(response.body.source, "fallback");
  assert.equal(response.body.plan.summary.title, "Recovering at home after pneumonia");
  assert.ok(response.body.agents.length >= 5);
  assert.deepEqual(response.body.warnings, []);
});

test("unknown routes return 404 JSON", async () => {
  const response = await postJson(createServer(), "/api/unknown", {});

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "NOT_FOUND");
});
