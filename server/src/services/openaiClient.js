const defaultModel = "gpt-4.1-mini";
const openAIResponsesUrl = "https://api.openai.com/v1/responses";

export class OpenAIClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OpenAIClientError";
    this.code = code;
  }
}

function stripJsonFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
  const text = output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((content) => {
      if (typeof content?.text === "string") {
        return content.text;
      }

      if (typeof content?.content === "string") {
        return content.content;
      }

      return "";
    })
    .join("")
    .trim();

  if (!text) {
    throw new OpenAIClientError("OPENAI_EMPTY_RESPONSE", "OpenAI response did not include output text.");
  }

  return text;
}

function parseJsonText(text) {
  try {
    return JSON.parse(stripJsonFence(text));
  } catch (error) {
    throw new OpenAIClientError("OPENAI_INVALID_JSON", "OpenAI returned text that was not valid JSON.");
  }
}

export async function generateJsonWithOpenAI({
  prompt,
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL || defaultModel,
  fetchImpl = globalThis.fetch
}) {
  if (!apiKey) {
    throw new OpenAIClientError("OPENAI_API_KEY_MISSING", "OPENAI_API_KEY is required for live OpenAI calls.");
  }

  if (typeof fetchImpl !== "function") {
    throw new OpenAIClientError("OPENAI_FETCH_MISSING", "A fetch implementation is required for OpenAI calls.");
  }

  const response = await fetchImpl(openAIResponsesUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: prompt,
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = typeof response.text === "function" ? await response.text() : "";
    throw new OpenAIClientError(
      "OPENAI_REQUEST_FAILED",
      `OpenAI request failed with status ${response.status}: ${errorBody}`
    );
  }

  const responseJson = await response.json();
  return parseJsonText(extractOutputText(responseJson));
}
