export const pitchSlides = [
  {
    eyebrow: 'Problem',
    title: 'Discharge Confusion Creates Avoidable Risk',
    summary:
      'Patients leave the hospital with dense instructions, medication changes, warning signs, and follow-up tasks they must manage alone.',
    points: [
      'Pneumonia recovery depends on clear medication use, symptom monitoring, and timely follow-up.',
      'Missed instructions can become avoidable readmissions or urgent calls.',
      'The handoff is fragile because the patient becomes the coordinator.'
    ]
  },
  {
    eyebrow: 'Solution',
    title: 'AI-Orchestrated Recovery Coordination',
    summary:
      'CAREFLOW turns discharge paperwork into a structured recovery workflow with specialized agents and patient-friendly dashboard sections.',
    points: [
      'Upload a PDF, paste text, or use the sample note for the demo.',
      'Agents extract facts, summarize recovery, organize medications, identify red flags, and create next steps.',
      'The app renders structured JSON instead of free-form model prose.'
    ]
  },
  {
    eyebrow: 'Demo Case',
    title: 'Pneumonia Patient Recovery Workflow',
    summary:
      'The live demo follows one pneumonia discharge from upload to dashboard to a safe medication question.',
    points: [
      'Live path: upload PDF, watch agents run, review the recovery plan.',
      'Chat question: Can I take ibuprofen with these medications?',
      'Sample note fallback and deterministic plan keep the demo moving if PDF parsing or live AI fails.'
    ]
  },
  {
    eyebrow: 'Architecture',
    title: 'Agent Pipeline',
    summary:
      'The MVP uses a simple sequential pipeline so the team can explain each AI role clearly.',
    points: [
      'Intake Agent extracts high-confidence facts and missing information.',
      'Summary, Medication, Risk, and Education Agents convert facts into dashboard sections.',
      'Conversation Agent answers from the generated plan and keeps medication decisions cautious.'
    ]
  },
  {
    eyebrow: 'Experience',
    title: 'Patient Command Center',
    summary:
      'The patient sees what happened, what to do today, when to take medications, warning signs, follow-ups, and grounded chat.',
    points: [
      'Plain-language recovery snapshot.',
      'Today plan, medication timeline, red flags, and follow-up checklist.',
      'Visible disclaimer reinforces that CAREFLOW is a prototype, not medical advice.'
    ]
  },
  {
    eyebrow: 'Buyer',
    title: 'Insurance Buyer Value',
    summary:
      'Insurers care because clearer recovery coordination can reduce avoidable readmissions and unmanaged post-discharge risk.',
    points: [
      'Better adherence to discharge instructions and follow-up tasks.',
      'Fewer avoidable readmissions, support calls, and confusion-driven escalations.',
      'A future care-team view can surface aggregate risk without changing the patient-first product.'
    ]
  },
  {
    eyebrow: 'Safety',
    title: 'Safety Boundaries',
    summary:
      'CAREFLOW helps explain discharge instructions but does not diagnose, prescribe, or replace clinicians.',
    points: [
      'Medication changes route to a doctor or pharmacist.',
      'Emergency symptoms escalate to emergency care.',
      'The prototype does not claim HIPAA or clinical compliance.'
    ]
  },
  {
    eyebrow: 'Next Phase',
    title: 'Future Android Implementation',
    summary:
      'The Android app reuses the same backend and recovery plan contract after the web MVP proves the workflow.',
    points: [
      'Patients scan or import discharge paperwork.',
      'Push reminders support medications and follow-ups.',
      'Caregiver sharing and an insurance risk dashboard become later phases.'
    ]
  }
];

export const demoSteps = [
  'Open CAREFLOW patient app',
  'Upload PDF',
  'Show agent pipeline',
  'Review dashboard',
  'Ask ibuprofen question',
  'Switch to this pitch deck'
];
