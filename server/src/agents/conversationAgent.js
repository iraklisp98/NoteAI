import { classifyChatSafety } from "../safety/chatSafetyClassifier.js";
import { generateJsonWithGemini } from "../services/geminiClient.js";

const EMERGENCY_SENTENCE =
  "If you have chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%, seek emergency care.";

export async function generateChatResponse({
  question,
  recoveryPlan,
  geminiChatGenerator = generateJsonWithGemini,
} = {}) {
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
      const modelPayload = await geminiChatGenerator({
        prompt: buildConversationPrompt({ question, plan, safety }),
      });
      const safePayload = normalizeModelPayload(modelPayload, safety);

      if (safePayload) {
        return safePayload;
      }
    } catch {
      // Fall through to deterministic safety fallback below.
    }
  }

  return buildFallbackAnswer({ question, plan, safety });
}

function buildFallbackAnswer({ question, plan, safety }) {
  if (safety.category === "medication_change") {
    return {
      answer:
        "I cannot tell you to change, stop, skip, or double a medication dose. Follow the discharge instructions you were given, and contact your doctor or pharmacist before making any medication changes. " +
        EMERGENCY_SENTENCE,
      source: "Medication Timeline",
      safetyLevel: "ask_doctor",
    };
  }

  if (safety.category === "medication_interaction") {
    return buildMedicationInteractionAnswer(plan);
  }

  return buildGroundedGeneralAnswer(question, plan);
}

function buildMedicationInteractionAnswer(plan) {
  const medicationNames = plan.medications.map((medication) => medication.name).filter(Boolean);
  const acetaminophen = plan.medications.find((medication) => /acetaminophen/i.test(medication.name || ""));

  if (medicationNames.length === 0) {
    return {
      answer:
        "I do not have medication details from the recovery plan, so I cannot check this safely. Before taking ibuprofen or adding any medicine, ask your doctor or pharmacist. " +
        EMERGENCY_SENTENCE,
      source: "Medication Timeline",
      safetyLevel: "ask_doctor",
    };
  }

  const medicationList = joinList(medicationNames.map(formatMedicationNameForChat));
  const acetaminophenNote = acetaminophen
    ? `, and it specifically gives acetaminophen instructions for ${lowerFirst(acetaminophen.purpose || "fever or discomfort")}`
    : "";

  return {
    answer:
      `I cannot confirm that ibuprofen is safe for you personally or tell you to add a medication. Your discharge plan lists ${medicationList}${acetaminophenNote}.\n\n` +
      "Before taking ibuprofen, check with your doctor or pharmacist, especially if you have kidney disease, stomach ulcers or bleeding, take blood thinners, have heart failure, or were told to avoid NSAIDs.\n\n" +
      EMERGENCY_SENTENCE,
    source: "Medication Timeline",
    safetyLevel: "ask_doctor",
  };
}

function buildGroundedGeneralAnswer(question, plan) {
  const normalizedQuestion = String(question || "").toLowerCase();

  if (normalizedQuestion.includes("follow")) {
    const followUps = plan.follow_ups
      .map((followUp) => `${followUp.task || "Follow up"} ${followUp.timeframe ? `(${followUp.timeframe})` : ""}`.trim())
      .filter(Boolean);

    return {
      answer: followUps.length
        ? `The recovery plan lists these follow-up steps: ${joinList(followUps)}. Contact your clinician if anything is unclear.`
        : "I do not see follow-up details in the recovery plan. Contact your clinician to confirm what follow-up is needed.",
      source: "Follow-Up Checklist",
      safetyLevel: "normal",
    };
  }

  if (normalizedQuestion.includes("red flag") || normalizedQuestion.includes("warning")) {
    const redFlags = plan.red_flags.map((flag) => flag.symptom).filter(Boolean);

    return {
      answer: redFlags.length
        ? `The recovery plan says to watch for: ${joinList(redFlags)}. ${EMERGENCY_SENTENCE}`
        : `I do not see warning symptoms in the recovery plan. ${EMERGENCY_SENTENCE}`,
      source: "Red Flags",
      safetyLevel: "normal",
    };
  }

  return {
    answer:
      "I can answer using the generated recovery plan, but I cannot diagnose new symptoms or replace medical advice. Ask about medications, today's tasks, red flags, or follow-up steps.",
    source: "Recovery Plan",
    safetyLevel: "normal",
  };
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

function joinList(items) {
  if (items.length <= 1) {
    return items[0] || "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function formatMedicationNameForChat(name) {
  return name.replace(/\s+inhaler\b/i, "").toLowerCase();
}
