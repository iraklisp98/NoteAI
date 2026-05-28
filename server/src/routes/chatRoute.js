import { generateChatResponse } from "../agents/conversationAgent.js";

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

export function createChatHandler() {
  return async function chatHandler(request, response) {
    const { question, recoveryPlan } = normalizeChatBody(request?.body);

    try {
      const payload = await generateChatResponse({ question, recoveryPlan });
      return response.status(200).json(payload);
    } catch (error) {
      return response.status(200).json({
        answer:
          "I could not safely process that question. Please ask using the recovery plan, and contact your doctor or pharmacist for medical decisions.",
        source: "Recovery Plan",
        safetyLevel: "ask_doctor",
      });
    }
  };
}

export async function handleChatRoute(request) {
  try {
    const { question, recoveryPlan } = normalizeChatBody(await readJsonBody(request));

    return await generateChatResponse({ question, recoveryPlan });
  } catch (error) {
    return {
      answer:
        "I could not safely process that question. Please ask using the recovery plan, and contact your doctor or pharmacist for medical decisions.",
      source: "Recovery Plan",
      safetyLevel: "ask_doctor"
    };
  }
}

const chatHandler = createChatHandler();

export function registerChatRoute(app) {
  app.post("/api/chat", chatHandler);
  return app;
}

export { chatHandler };
