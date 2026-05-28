import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import samplePlan from "../../shared/sampleRecoveryPlan.json" assert { type: "json" };
import { generateChatResponse, runConversationAgent } from "../src/agents/conversationAgent.js";
import { createChatHandler, registerChatRoute } from "../src/routes/chatRoute.js";
import { classifyChatSafety } from "../src/safety/chatSafetyClassifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const goldenIbuprofenAnswer = readFileSync(path.join(__dirname, "../../shared/goldenIbuprofenAnswer.txt"), "utf8").trim();

test("ibuprofen question routes to doctor or pharmacist guidance", () => {
  const result = classifyChatSafety("Can I take ibuprofen with these medications?");

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.equal(result.category, "medication_interaction");
});

test("emergency symptoms always escalate", () => {
  const result = generateChatResponse({
    question: "I have chest pain and severe trouble breathing. Is that okay?",
    recoveryPlan: samplePlan,
  });

  assert.equal(result.safetyLevel, "emergency");
  assert.match(result.answer, /seek emergency care/i);
});

test("ibuprofen answer is grounded in the recovery plan medications", () => {
  const result = generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.equal(result.source, "Medication Timeline");
  assert.match(result.answer, /amoxicillin\/clavulanate/i);
  assert.match(result.answer, /albuterol/i);
  assert.match(result.answer, /acetaminophen/i);
  assert.match(result.answer, /doctor or pharmacist/i);
});

test("sample ibuprofen question returns the golden demo answer", () => {
  const result = generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
  });

  assert.equal(result.answer, goldenIbuprofenAnswer);
});

test("missing medication data produces uncertainty language", () => {
  const result = generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: { ...samplePlan, medications: [] },
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.match(result.answer, /do not have medication details/i);
  assert.match(result.answer, /doctor or pharmacist/i);
});

test("medication dose changes are refused safely", () => {
  const result = generateChatResponse({
    question: "Can I double my antibiotic dose tonight?",
    recoveryPlan: samplePlan,
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.match(result.answer, /cannot tell you to change/i);
  assert.match(result.answer, /doctor or pharmacist/i);
});

test("conversation agent calls Gemini for ordinary grounded questions", async () => {
  const prompts = [];
  const result = await runConversationAgent({
    question: "What follow-up do I need?",
    recoveryPlan: samplePlan,
    geminiJsonGenerator: async ({ prompt }) => {
      prompts.push(prompt);
      return {
        answer: "Your plan says to follow up with primary care in 3-5 days.",
        source: "Follow-Up Checklist",
        safetyLevel: "normal"
      };
    }
  });

  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /You are CAREFLOW's Conversation Agent/);
  assert.equal(result.source, "Follow-Up Checklist");
  assert.equal(result.safetyLevel, "normal");
  assert.match(result.answer, /3-5 days/);
});

test("conversation agent keeps medication interaction questions deterministic", async () => {
  let callCount = 0;
  const result = await runConversationAgent({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
    geminiJsonGenerator: async () => {
      callCount += 1;
      return {};
    }
  });

  assert.equal(callCount, 0);
  assert.equal(result.answer, goldenIbuprofenAnswer);
});

test("conversation agent falls back safely when Gemini returns invalid chat output", async () => {
  const result = await runConversationAgent({
    question: "What follow-up do I need?",
    recoveryPlan: samplePlan,
    geminiJsonGenerator: async () => ({
      answer: "Primary care follow-up"
    })
  });

  assert.equal(result.source, "Follow-Up Checklist");
  assert.equal(result.safetyLevel, "normal");
  assert.match(result.answer, /follow-up steps/i);
});

test("chat route remains stable for malformed input", async () => {
  const handler = createChatHandler();
  const response = await callHandler(handler, { body: { question: 42, recoveryPlan: null } });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.safetyLevel, "normal");
  assert.match(response.body.answer, /ask a question/i);
});

test("chat route registers POST /api/chat", () => {
  const calls = [];
  const app = {
    post(path, handler) {
      calls.push({ path, handler });
    },
  };

  registerChatRoute(app);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/chat");
  assert.equal(typeof calls[0].handler, "function");
});

async function callHandler(handler, request) {
  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  await handler(request, response);
  return response;
}
