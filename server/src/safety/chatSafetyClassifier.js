const EMERGENCY_PATTERNS = [
  /\bsevere (trouble|difficulty) breathing\b/i,
  /\b(can'?t|cannot) breathe\b/i,
  /\bchest pain\b/i,
  /\bconfusion\b/i,
  /\bblue lips?\b/i,
  /\bfaint(ed|ing)?\b/i,
  /\boxygen\b.*\b(8\d|below 90|under 90|less than 90)\b/i,
  /\b(o2|spo2)\b.*\b(8\d|below 90|under 90|less than 90)\b/i,
];

const MEDICATION_INTERACTION_PATTERNS = [
  /\bibuprofen\b/i,
  /\badvil\b/i,
  /\bmotrin\b/i,
  /\bnsaids?\b/i,
  /\bcan i take\b.*\b(with|while|together)\b/i,
  /\bsafe\b.*\bmedication/i,
  /\binteract(ion|ions)?\b/i,
];

const MEDICATION_CHANGE_PATTERNS = [
  /\bdouble\b.*\b(dose|medication|medicine|antibiotic)\b/i,
  /\b(change|increase|decrease|raise|lower|skip|stop)\b.*\b(dose|medication|medicine|antibiotic|inhaler)\b/i,
  /\b(take more|take less)\b/i,
  /\bhow many\b.*\b(can|should)\b.*\btake\b/i,
];

export function classifyChatSafety(question) {
  const text = typeof question === "string" ? question.trim() : "";

  if (!text) {
    return {
      safetyLevel: "normal",
      category: "empty",
    };
  }

  if (matchesAny(text, EMERGENCY_PATTERNS)) {
    return {
      safetyLevel: "emergency",
      category: "emergency_symptoms",
    };
  }

  if (matchesAny(text, MEDICATION_CHANGE_PATTERNS)) {
    return {
      safetyLevel: "ask_doctor",
      category: "medication_change",
    };
  }

  if (matchesAny(text, MEDICATION_INTERACTION_PATTERNS)) {
    return {
      safetyLevel: "ask_doctor",
      category: "medication_interaction",
    };
  }

  return {
    safetyLevel: "normal",
    category: "general",
  };
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}
