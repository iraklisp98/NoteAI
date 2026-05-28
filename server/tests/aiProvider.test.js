import assert from "node:assert/strict";
import test from "node:test";

import { generateJsonWithConfiguredProvider, getConfiguredAIProvider } from "../src/services/aiProvider.js";

test("selects OpenAI when AI_PROVIDER is openai", async () => {
  const calls = [];
  const result = await generateJsonWithConfiguredProvider({
    prompt: "Return JSON",
    provider: "openai",
    openAIApiKey: "test-openai-key",
    openAIModel: "openai-test-model",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return { output_text: "{\"provider\":\"openai\"}" };
        },
        async text() {
          return "";
        }
      };
    }
  });

  assert.deepEqual(result, { provider: "openai" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.openai.com/v1/responses");
});

test("selects Gemini when AI_PROVIDER is gemini", async () => {
  const calls = [];
  const result = await generateJsonWithConfiguredProvider({
    prompt: "Return JSON",
    provider: "gemini",
    geminiApiKey: "test-gemini-key",
    geminiModel: "gemini-test-model",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            candidates: [
              {
                content: {
                  parts: [{ text: "{\"provider\":\"gemini\"}" }]
                }
              }
            ]
          };
        },
        async text() {
          return "";
        }
      };
    }
  });

  assert.deepEqual(result, { provider: "gemini" });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /gemini-test-model:generateContent/);
});

test("uses OpenAI by default when OPENAI_API_KEY is configured", () => {
  assert.equal(
    getConfiguredAIProvider({
      provider: "",
      openAIApiKey: "test-openai-key",
      geminiApiKey: "test-gemini-key"
    }),
    "openai"
  );
});

test("rejects unsupported AI providers", async () => {
  await assert.rejects(
    () =>
      generateJsonWithConfiguredProvider({
        prompt: "Return JSON",
        provider: "other-provider"
      }),
    /Unsupported AI provider/
  );
});
