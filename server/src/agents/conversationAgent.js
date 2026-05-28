import { classifyChatSafety } from "../safety/chatSafetyClassifier.js";
import { generateJsonWithConfiguredProvider } from "../services/aiProvider.js";

const EMERGENCY_SENTENCE =
  "If you have chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%, seek emergency care.";

export class ChatGenerationError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "ChatGenerationError";
    this.code = code;
    this.cause = cause;
  }
}

export async function generateChatResponse({
  question,
  recoveryPlan,
  aiChatGenerator,
  geminiChatGenerator,
} = {}) {
  const chatGenerator = aiChatGenerator || geminiChatGenerator || generateJsonWithConfiguredProvider;
  const safety = classifyChatSafety(question);
  const plan = normalizePlan(recoveryPlan);

  if (safety.category === "empty") {
    return {
      answer: "Please ask a question about the recovery plan, medications, warning symptoms, or follow-up instructions.",
      source: "Recovery Plan",
      safetyLevel: "normal",
    };
  }

  if (safety.safetyLevel === "emergency") {
    return {
      answer: `${EMERGENCY_SENTENCE} CAREFLOW cannot tell you urgent care is unnecessary or diagnose new symptoms.`,
      source: "Red Flags",
      safetyLevel: "emergency",
    };
  }

  if (safety.category !== "empty") {
    try {
      const modelPayload = await chatGenerator({
        prompt: buildConversationPrompt({ question, plan, safety }),
      });
      const safePayload = normalizeModelPayload(modelPayload, safety);

      if (safePayload) {
        return safePayload;
      }

      throw new ChatGenerationError(
        "CHAT_AGENT_OUTPUT_INVALID",
        "The live AI Conversation Agent returned an unsafe or invalid answer."
      );
    } catch (error) {
      if (error instanceof ChatGenerationError) {
        throw error;
      }

      throw new ChatGenerationError(
        "CHAT_AGENT_GENERATION_FAILED",
        "The live AI Conversation Agent could not answer this question.",
        error
      );
    }
  }

  throw new ChatGenerationError(
    "CHAT_AGENT_GENERATION_FAILED",
    "The live AI Conversation Agent could not answer this question."
  );
}

function buildConversationPrompt({ question, plan, safety }) {
  return [
    "You are the CAREFLOW Conversation Agent for a prototype patient discharge app.",
    "Answer only from the recovery plan JSON. If information is missing, say it is missing.",
    "Do not diagnose new symptoms, prescribe medication, change doses, stop medication, guarantee medication safety, or replace emergency services.",
    "For medication changes or adding medicines, tell the patient to ask a doctor or pharmacist.",
    `Always include this emergency escalation sentence when relevant: ${EMERGENCY_SENTENCE}`,
    "Return only JSON with this exact shape: {\"answer\":\"\",\"source\":\"Recovery Plan\",\"safetyLevel\":\"normal\"}.",
    `Safety category: ${safety.category}`,
    `Required safety level: ${safety.safetyLevel}`,
    `Patient question: ${String(question || "").trim()}`,
    `Recovery plan JSON: ${JSON.stringify(plan)}`,
  ].join("\n\n");
}

function normalizeModelPayload(payload, safety) {
  if (!payload || typeof payload !== "object" || typeof payload.answer !== "string") {
    return null;
  }

  const answer = payload.answer.trim();
  if (!answer) {
    return null;
  }

  if (
    (safety.category === "medication_interaction" || safety.category === "medication_change") &&
    !/\bdoctor\b|\bpharmacist\b/i.test(answer)
  ) {
    return null;
  }

  return {
    answer,
    source: typeof payload.source === "string" && payload.source.trim() ? payload.source.trim() : "Recovery Plan",
    safetyLevel: safety.safetyLevel,
  };
}

function normalizePlan(recoveryPlan) {
  const plan = recoveryPlan && typeof recoveryPlan === "object" ? recoveryPlan : {};

  return {
    medications: Array.isArray(plan.medications) ? plan.medications : [],
    red_flags: Array.isArray(plan.red_flags) ? plan.red_flags : [],
    follow_ups: Array.isArray(plan.follow_ups) ? plan.follow_ups : [],
  };
}
