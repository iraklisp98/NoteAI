const DISCLAIMER =
  "CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.";

function uniqueStrings(items) {
  return [...new Set(items.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))];
}

export function composeRecoveryPlan({ intake, summary, medication, risk, education }) {
  return {
    summary,
    today: [...medication.today, ...education.today],
    medications: medication.medications,
    red_flags: risk.red_flags,
    follow_ups: education.follow_ups,
    questions_for_clinician: education.questions_for_clinician,
    missing_information: uniqueStrings([
      ...intake.missing_information,
      ...medication.missing_information,
      ...education.missing_information
    ]),
    disclaimer: DISCLAIMER
  };
}
