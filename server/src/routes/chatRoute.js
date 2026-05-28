import { ChatGenerationError, generateChatResponse } from "../agents/conversationAgent.js";

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody);
}

function normalizeChatBody(body) {
  const source = body && typeof body === "object" ? body : {};

  return {
    question: typeof source.question === "string" ? source.question : "",
    recoveryPlan:
      source.recoveryPlan && typeof source.recoveryPlan === "object"
        ? source.recoveryPlan
        : source.plan && typeof source.plan === "object"
          ? source.plan
          : {}
  };
}

export function createChatHandler({ chatGenerator } = {}) {
  return async function chatHandler(request, response) {
    const { question, recoveryPlan } = normalizeChatBody(request?.body);

    try {
      const payload = await generateChatResponse({ question, recoveryPlan, geminiChatGenerator: chatGenerator });
      return response.status(200).json(payload);
    } catch (error) {
      if (error instanceof ChatGenerationError) {
        return response.status(502).json({
          error: error.code,
          message: error.message
        });
      }

      throw error;
    }
  };
}

export async function handleChatRoute(request) {
  try {
    const { question, recoveryPlan } = normalizeChatBody(await readJsonBody(request));

    return await generateChatResponse({ question, recoveryPlan });
  } catch (error) {
    if (error instanceof ChatGenerationError) {
      return {
        statusCode: 502,
        body: {
          error: error.code,
          message: error.message
        }
      };
    }

    throw error;
  }
}

const chatHandler = createChatHandler();

export function registerChatRoute(app) {
  app.post("/api/chat", chatHandler);
  return app;
}

export { chatHandler };
