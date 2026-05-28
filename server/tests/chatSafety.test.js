const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const samplePlan = require("../../shared/sampleRecoveryPlan.json");
const goldenIbuprofenAnswer = fs
  .readFileSync(path.join(__dirname, "../../shared/goldenIbuprofenAnswer.txt"), "utf8")
  .trim();
const { classifyChatSafety } = require("../src/safety/chatSafetyClassifier");
const { generateChatResponse } = require("../src/agents/conversationAgent");
const { createChatHandler, registerChatRoute } = require("../src/routes/chatRoute");

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
