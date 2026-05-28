import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../src/index.js";

async function postMultipart(server, path, fields) {
  const boundary = "careflow-test-boundary";
  const chunks = [];

  for (const field of fields) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    if (field.filename) {
      chunks.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${field.name}"; filename="${field.filename}"\r\n` +
            `Content-Type: ${field.contentType || "application/octet-stream"}\r\n\r\n`
        )
      );
      chunks.push(Buffer.isBuffer(field.value) ? field.value : Buffer.from(String(field.value)));
      chunks.push(Buffer.from("\r\n"));
    } else {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${field.name}"\r\n\r\n${field.value}\r\n`));
    }
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  const listener = server.listen(0);
  await new Promise((resolve) => listener.once("listening", resolve));
  const { port } = listener.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      body: Buffer.concat(chunks)
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

test("POST /api/recovery-plan requires discharge text", async () => {
  const response = await postJson(createServer(), "/api/recovery-plan", {});

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "RECOVERY_TEXT_REQUIRED");
  assert.match(response.body.message, /discharge text/i);
});

test("unknown routes return 404 JSON", async () => {
  const response = await postJson(createServer(), "/api/unknown", {});

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "NOT_FOUND");
});

test("POST /api/recovery-plan surfaces live Gemini failures instead of returning a local plan", async () => {
  const response = await postJson(createServer(), "/api/recovery-plan", {
    text: [
      "Discharge diagnosis: Acute bronchitis",
      "Discharge medications:",
      "Doxycycline 100 mg by mouth twice daily for 7 days.",
      "Follow-up: Pulmonology clinic in 1 week."
    ].join("\n")
  });

  assert.equal(response.status, 502);
  assert.equal(response.body.error, "RECOVERY_AGENT_GENERATION_FAILED");
  assert.match(response.body.message, /live Gemini/i);
});

test("POST /api/recovery-plan requires live Gemini for a readable uploaded PDF", async () => {
  const response = await postMultipart(createServer(), "/api/recovery-plan", [
    {
      name: "file",
      filename: "discharge.pdf",
      contentType: "application/pdf",
      value: Buffer.from([
        "Discharge diagnosis: Sinus infection",
        "Discharge medications:",
        "Azithromycin 250 mg by mouth daily for 4 days.",
        "Follow-up: ENT clinic in 2 weeks."
      ].join("\n"))
    }
  ]);

  assert.equal(response.status, 502);
  assert.notEqual(response.body.error, "PDF_TEXT_EXTRACTION_FAILED");
  assert.equal(response.body.error, "RECOVERY_AGENT_GENERATION_FAILED");
  assert.match(response.body.message, /live Gemini/i);
});

test("POST /api/recovery-plan returns fallback-friendly error when PDF text extraction fails", async () => {
  const response = await postMultipart(createServer(), "/api/recovery-plan", [
    {
      name: "file",
      filename: "scanned.pdf",
      contentType: "application/pdf",
      value: Buffer.from("%PDF-1.7\n%binary scanned content")
    }
  ]);

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "PDF_TEXT_EXTRACTION_FAILED");
  assert.match(response.body.message, /Paste the discharge text or upload a PDF/);
});
