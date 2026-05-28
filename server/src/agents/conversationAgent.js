import { classifyChatSafety } from "../safety/chatSafetyClassifier.js";
import { generateJsonWithGemini } from "../services/geminiClient.js";

const EMERGENCY_SENTENCE =
  "If you have chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%, seek emergency care.";
const allowedSafetyLevels = new Set(["normal", "ask_doctor", "emergency"]);

class ConversationAgentValidationError extends Error {
  constructor(errors) {
    super(`Conversation Agent output was invalid: ${errors.join("; ")}`);
    this.name = "ConversationAgentValidationError";
    this.errors = errors;
  }
}

export function generateChatResponse({ question, recoveryPlan } = {}) {
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

export async function runConversationAgent({
  question,
  recoveryPlan,
  geminiJsonGenerator = generateJsonWithGemini
} = {}) {
  const safety = classifyChatSafety(question);

  if (safety.category !== "general") {
    return generateChatResponse({ question, recoveryPlan });
  }

  try {
    const output = await geminiJsonGenerator({
      prompt: buildConversationPrompt({ question, recoveryPlan })
    });

    return validateConversationOutput(output);
  } catch (error) {
    return generateChatResponse({ question, recoveryPlan });
  }
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

function buildConversationPrompt({ question, recoveryPlan }) {
  return `
You are CAREFLOW's Conversation Agent.

Answer the patient's question using only the recovery plan JSON plus general safety guidance.

Return JSON only with this exact shape:
{
  "answer": "",
  "source": "Recovery Plan | Today's Plan | Medication Timeline | Red Flags | Follow-Up Checklist",
  "safetyLevel": "normal | ask_doctor | emergency"
}

Rules:
- Do not diagnose new conditions.
- Do not prescribe, stop, or change medication doses.
- If information is missing, say it is missing.
- For medication changes or additions, tell the patient to ask a doctor or pharmacist.
- Never tell the patient emergency care is unnecessary.
- Escalate chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%.
- Keep the answer concise and patient-friendly.

Patient question:
${question || ""}

Recovery plan JSON:
${JSON.stringify(recoveryPlan || {})}
`.trim();
}

function validateConversationOutput(output) {
  const errors = [];

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    throw new ConversationAgentValidationError(["output must be an object"]);
  }

  if (typeof output.answer !== "string" || !output.answer.trim()) {
    errors.push("answer must be a non-empty string");
  }

  if (typeof output.source !== "string" || !output.source.trim()) {
    errors.push("source must be a non-empty string");
  }

  if (typeof output.safetyLevel !== "string" || !allowedSafetyLevels.has(output.safetyLevel)) {
    errors.push("safetyLevel must be normal, ask_doctor, or emergency");
  }

  if (errors.length > 0) {
    throw new ConversationAgentValidationError(errors);
  }

  return {
    answer: output.answer,
    source: output.source,
    safetyLevel: output.safetyLevel
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
