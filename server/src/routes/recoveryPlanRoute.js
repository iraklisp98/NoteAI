import { buildRecoveryPlan } from "../services/recoveryPlanService.js";

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

export async function handleRecoveryPlanRoute(request) {
  const body = await readJsonBody(request);

  return buildRecoveryPlan({
    text: body.text,
    useSample: body.useSample === true
  });
}
