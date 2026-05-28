import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { generateChatResponse } from "../src/agents/conversationAgent.js";
import { createChatHandler, registerChatRoute } from "../src/routes/chatRoute.js";
import { classifyChatSafety } from "../src/safety/chatSafetyClassifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePlan = JSON.parse(readFileSync(path.join(__dirname, "../../shared/sampleRecoveryPlan.json"), "utf8"));
const goldenIbuprofenAnswer = readFileSync(path.join(__dirname, "../../shared/goldenIbuprofenAnswer.txt"), "utf8").trim();

test("ibuprofen question routes to doctor or pharmacist guidance", () => {
  const result = classifyChatSafety("Can I take ibuprofen with these medications?");

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.equal(result.category, "medication_interaction");
});

test("emergency symptoms always escalate", async () => {
  const result = await generateChatResponse({
    question: "I have chest pain and severe trouble breathing. Is that okay?",
    recoveryPlan: samplePlan,
  });

  assert.equal(result.safetyLevel, "emergency");
  assert.match(result.answer, /seek emergency care/i);
});

test("ibuprofen answer is grounded in the recovery plan medications", async () => {
  const result = await generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
    geminiChatGenerator: async () => {
      throw new Error("force fallback");
    },
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.equal(result.source, "Medication Timeline");
  assert.match(result.answer, /amoxicillin\/clavulanate/i);
  assert.match(result.answer, /albuterol/i);
  assert.match(result.answer, /acetaminophen/i);
  assert.match(result.answer, /doctor or pharmacist/i);
});

test("sample ibuprofen question returns the golden demo answer when Gemini is unavailable", async () => {
  const result = await generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
    geminiChatGenerator: async () => {
      throw new Error("force fallback");
    },
  });

  assert.equal(result.answer, goldenIbuprofenAnswer);
});

test("Gemini conversation answers are grounded in the recovery plan", async () => {
  const calls = [];
  const result = await generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: samplePlan,
    geminiChatGenerator: async ({ prompt }) => {
      calls.push(prompt);
      return {
        answer:
          "Gemini checked the recovery plan medications and cannot confirm ibuprofen is safe. The plan lists amoxicillin/clavulanate, albuterol, and acetaminophen, so ask your doctor or pharmacist before taking ibuprofen.",
        source: "Medication Timeline",
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0], /amoxicillin\/clavulanate/i);
  assert.match(calls[0], /albuterol/i);
  assert.match(calls[0], /acetaminophen/i);
  assert.match(calls[0], /Return only JSON/i);
  assert.equal(result.safetyLevel, "ask_doctor");
  assert.equal(result.source, "Medication Timeline");
  assert.match(result.answer, /Gemini checked/i);
});

test("missing medication data produces uncertainty language", async () => {
  const result = await generateChatResponse({
    question: "Can I take ibuprofen with these medications?",
    recoveryPlan: { ...samplePlan, medications: [] },
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.match(result.answer, /do not have medication details/i);
  assert.match(result.answer, /doctor or pharmacist/i);
});

test("medication dose changes are refused safely", async () => {
  const result = await generateChatResponse({
    question: "Can I double my antibiotic dose tonight?",
    recoveryPlan: samplePlan,
    geminiChatGenerator: async () => {
      throw new Error("force fallback");
    },
  });

  assert.equal(result.safetyLevel, "ask_doctor");
  assert.match(result.answer, /cannot tell you to change/i);
  assert.match(result.answer, /doctor or pharmacist/i);
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
