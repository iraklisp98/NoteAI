import { generateJsonWithGemini } from "./geminiClient.js";
import { generateJsonWithOpenAI } from "./openaiClient.js";

export function getConfiguredAIProvider({
  provider = process.env.AI_PROVIDER,
  openAIApiKey = process.env.OPENAI_API_KEY,
  geminiApiKey = process.env.GEMINI_API_KEY
} = {}) {
  const configuredProvider = String(provider || "").trim().toLowerCase();

  if (configuredProvider) {
    return configuredProvider;
  }

  if (openAIApiKey) {
    return "openai";
  }

  if (geminiApiKey) {
    return "gemini";
  }

  return "openai";
}

export async function generateJsonWithConfiguredProvider({
  prompt,
  provider,
  openAIApiKey = process.env.OPENAI_API_KEY,
  openAIModel = process.env.OPENAI_MODEL,
  geminiApiKey = process.env.GEMINI_API_KEY,
  geminiModel = process.env.GEMINI_MODEL,
  fetchImpl = globalThis.fetch
}) {
  const selectedProvider = getConfiguredAIProvider({
    provider,
    openAIApiKey,
    geminiApiKey
  });

  if (selectedProvider === "openai") {
    return generateJsonWithOpenAI({
      prompt,
      apiKey: openAIApiKey,
      model: openAIModel,
      fetchImpl
    });
  }

  if (selectedProvider === "gemini") {
    return generateJsonWithGemini({
      prompt,
      apiKey: geminiApiKey,
      model: geminiModel,
      fetchImpl
    });
  }

  throw new Error(`Unsupported AI provider: ${selectedProvider}`);
}
