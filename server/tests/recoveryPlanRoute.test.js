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

test("POST /api/recovery-plan falls back deterministically when AI path fails", async () => {
  const response = await postJson(createServer(), "/api/recovery-plan", {
    text: "Discharge diagnosis: pneumonia"
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.source, "fallback");
  assert.match(response.body.warnings.join("\n"), /Gemini generation failed/);
  assert.equal(response.body.plan.summary.title, "Recovering at home after pneumonia");
});

test("POST /api/recovery-plan accepts a readable uploaded text PDF fallback", async () => {
  const response = await postMultipart(createServer(), "/api/recovery-plan", [
    {
      name: "file",
      filename: "discharge.pdf",
      contentType: "application/pdf",
      value: Buffer.from("Discharge diagnosis: pneumonia")
    }
  ]);

  assert.equal(response.status, 200);
  assert.notEqual(response.body.error, "PDF_TEXT_EXTRACTION_FAILED");
  assert.equal(response.body.plan.summary.title, "Recovering at home after pneumonia");
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
