const defaultModel = "gemini-2.5-flash";
const geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "GeminiClientError";
    this.code = code;
  }
}

function stripJsonFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractCandidateText(responseJson) {
  const parts = responseJson?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    throw new GeminiClientError("GEMINI_EMPTY_RESPONSE", "Gemini response did not include candidate text.");
  }

  const text = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (!text) {
    throw new GeminiClientError("GEMINI_EMPTY_RESPONSE", "Gemini response text was empty.");
  }

  return text;
}

function parseJsonText(text) {
  try {
    return JSON.parse(stripJsonFence(text));
  } catch (error) {
    throw new GeminiClientError("GEMINI_INVALID_JSON", "Gemini returned text that was not valid JSON.");
  }
}

export async function generateJsonWithGemini({
  prompt,
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || defaultModel,
  fetchImpl = globalThis.fetch
}) {
  if (!apiKey) {
    throw new GeminiClientError("GEMINI_API_KEY_MISSING", "GEMINI_API_KEY is required for live Gemini calls.");
  }

  if (typeof fetchImpl !== "function") {
    throw new GeminiClientError("GEMINI_FETCH_MISSING", "A fetch implementation is required for Gemini calls.");
  }

  const response = await fetchImpl(`${geminiBaseUrl}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorBody = typeof response.text === "function" ? await response.text() : "";
    throw new GeminiClientError(
      "GEMINI_REQUEST_FAILED",
      `Gemini request failed with status ${response.status}: ${errorBody}`
    );
  }

  const responseJson = await response.json();
  return parseJsonText(extractCandidateText(responseJson));
}
