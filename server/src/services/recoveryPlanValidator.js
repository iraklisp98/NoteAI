const requiredTopLevelFields = [
  "summary",
  "today",
  "medications",
  "red_flags",
  "follow_ups",
  "questions_for_clinician",
  "missing_information",
  "disclaimer"
];

const summaryFields = ["title", "what_happened", "recovery_goal"];
const todayFields = ["task", "why_it_matters", "source"];
const medicationFields = ["name", "dose", "timing", "purpose", "instructions", "caution"];
const redFlagFields = ["symptom", "action", "urgency"];
const followUpFields = ["task", "timeframe", "reason"];
const redFlagUrgencies = new Set(["emergency_now", "call_today", "monitor"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireStringFields(value, fields, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const field of fields) {
    if (typeof value[field] !== "string") {
      errors.push(`${path}.${field} must be a string`);
    }
  }
}

function requireArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  return true;
}

function requireStringArray(value, path, errors) {
  if (!requireArray(value, path, errors)) {
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== "string") {
      errors.push(`${path}[${index}] must be a string`);
    }
  });
}

function requireObjectArray(value, fields, path, errors) {
  if (!requireArray(value, path, errors)) {
    return;
  }

  value.forEach((item, index) => {
    requireStringFields(item, fields, `${path}[${index}]`, errors);
  });
}

export function validateRecoveryPlan(plan) {
  const errors = [];

  if (!isPlainObject(plan)) {
    return { valid: false, errors: ["plan must be an object"] };
  }

  for (const field of requiredTopLevelFields) {
    if (!(field in plan)) {
      errors.push(`${field} is required`);
    }
  }

  if ("summary" in plan) {
    requireStringFields(plan.summary, summaryFields, "summary", errors);
  }

  if ("today" in plan) {
    requireObjectArray(plan.today, todayFields, "today", errors);
  }

  if ("medications" in plan) {
    requireObjectArray(plan.medications, medicationFields, "medications", errors);
  }

  if ("red_flags" in plan) {
    requireObjectArray(plan.red_flags, redFlagFields, "red_flags", errors);
    if (Array.isArray(plan.red_flags)) {
      plan.red_flags.forEach((item, index) => {
        if (isPlainObject(item) && typeof item.urgency === "string" && !redFlagUrgencies.has(item.urgency)) {
          errors.push(`red_flags[${index}].urgency must be emergency_now, call_today, or monitor`);
        }
      });
    }
  }

  if ("follow_ups" in plan) {
    requireObjectArray(plan.follow_ups, followUpFields, "follow_ups", errors);
  }

  if ("questions_for_clinician" in plan) {
    requireStringArray(plan.questions_for_clinician, "questions_for_clinician", errors);
  }

  if ("missing_information" in plan) {
    requireStringArray(plan.missing_information, "missing_information", errors);
  }

  if ("disclaimer" in plan && typeof plan.disclaimer !== "string") {
    errors.push("disclaimer must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
