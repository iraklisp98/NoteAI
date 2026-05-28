import assert from "node:assert/strict";
import test from "node:test";

import { GeminiClientError, generateJsonWithGemini } from "../src/services/geminiClient.js";

function createMockResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    }
  };
}

test("parses JSON from a mocked Gemini response", async () => {
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return createMockResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                text: "{\"summary\":{\"title\":\"Pneumonia recovery\"}}"
              }
            ]
          }
        }
      ]
    });
  };

  const result = await generateJsonWithGemini({
    prompt: "Return JSON",
    apiKey: "test-key",
    model: "gemini-test",
    fetchImpl
  });

  assert.deepEqual(result, {
    summary: {
      title: "Pneumonia recovery"
    }
  });
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].url, /gemini-test:generateContent/);
  assert.equal(JSON.parse(fetchCalls[0].options.body).generationConfig.responseMimeType, "application/json");
});

test("strips markdown JSON fences before parsing", async () => {
  const fetchImpl = async () =>
    createMockResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                text: "```json\n{\"ok\":true}\n```"
              }
            ]
          }
        }
      ]
    });

  const result = await generateJsonWithGemini({
    prompt: "Return JSON",
    apiKey: "test-key",
    fetchImpl
  });

  assert.deepEqual(result, { ok: true });
});

test("throws a typed error when Gemini returns invalid JSON", async () => {
  const fetchImpl = async () =>
    createMockResponse({
      candidates: [
        {
          content: {
            parts: [{ text: "not json" }]
          }
        }
      ]
    });

  await assert.rejects(
    () =>
      generateJsonWithGemini({
        prompt: "Return JSON",
        apiKey: "test-key",
        fetchImpl
      }),
    (error) => {
      assert.ok(error instanceof GeminiClientError);
      assert.equal(error.code, "GEMINI_INVALID_JSON");
      return true;
    }
  );
});

test("throws a typed error when no API key is available", async () => {
  await assert.rejects(
    () =>
      generateJsonWithGemini({
        prompt: "Return JSON",
        apiKey: "",
        fetchImpl: async () => {
          throw new Error("fetch should not be called");
        }
      }),
    (error) => {
      assert.ok(error instanceof GeminiClientError);
      assert.equal(error.code, "GEMINI_API_KEY_MISSING");
      return true;
    }
  );
});
