import assert from "node:assert/strict";
import test from "node:test";

import { generateJsonWithOpenAI, OpenAIClientError } from "../src/services/openaiClient.js";

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

test("parses JSON from a mocked OpenAI Responses API response", async () => {
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return createMockResponse({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: "{\"summary\":{\"title\":\"OpenAI pneumonia plan\"}}"
            }
          ]
        }
      ]
    });
  };

  const result = await generateJsonWithOpenAI({
    prompt: "Return JSON",
    apiKey: "test-openai-key",
    model: "openai-test-model",
    fetchImpl
  });

  assert.deepEqual(result, {
    summary: {
      title: "OpenAI pneumonia plan"
    }
  });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://api.openai.com/v1/responses");
  assert.equal(fetchCalls[0].options.headers.authorization, "Bearer test-openai-key");

  const body = JSON.parse(fetchCalls[0].options.body);
  assert.equal(body.model, "openai-test-model");
  assert.equal(body.input, "Return JSON");
  assert.equal(body.text.format.type, "json_object");
});

test("strips markdown JSON fences before parsing OpenAI output", async () => {
  const result = await generateJsonWithOpenAI({
    prompt: "Return JSON",
    apiKey: "test-openai-key",
    fetchImpl: async () =>
      createMockResponse({
        output_text: "```json\n{\"ok\":true}\n```"
      })
  });

  assert.deepEqual(result, { ok: true });
});

test("throws a typed error when OpenAI returns invalid JSON", async () => {
  await assert.rejects(
    () =>
      generateJsonWithOpenAI({
        prompt: "Return JSON",
        apiKey: "test-openai-key",
        fetchImpl: async () =>
          createMockResponse({
            output: [
              {
                content: [{ type: "output_text", text: "not json" }]
              }
            ]
          })
      }),
    (error) => {
      assert.ok(error instanceof OpenAIClientError);
      assert.equal(error.code, "OPENAI_INVALID_JSON");
      return true;
    }
  );
});

test("throws a typed error when no OpenAI API key is available", async () => {
  await assert.rejects(
    () =>
      generateJsonWithOpenAI({
        prompt: "Return JSON",
        apiKey: "",
        fetchImpl: async () => {
          throw new Error("fetch should not be called");
        }
      }),
    (error) => {
      assert.ok(error instanceof OpenAIClientError);
      assert.equal(error.code, "OPENAI_API_KEY_MISSING");
      return true;
    }
  );
});
