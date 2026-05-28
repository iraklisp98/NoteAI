const { generateChatResponse } = require("../agents/conversationAgent");

function createChatHandler() {
  return async function chatHandler(request, response) {
    const body = request && typeof request.body === "object" && request.body !== null ? request.body : {};
    const question = typeof body.question === "string" ? body.question : "";
    const recoveryPlan = body.recoveryPlan && typeof body.recoveryPlan === "object" ? body.recoveryPlan : {};

    try {
      const payload = generateChatResponse({ question, recoveryPlan });
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

const chatHandler = createChatHandler();

function registerChatRoute(app) {
  app.post("/api/chat", chatHandler);
  return app;
}

module.exports = {
  createChatHandler,
  registerChatRoute,
  chatHandler,
};
