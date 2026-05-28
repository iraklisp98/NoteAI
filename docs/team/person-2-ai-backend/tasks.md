# Person 2 Tasks: AI Backend

## Ownership

You own the Node.js server, Gemini API integration, PDF extraction, agent pipeline, validation, and safety filters.

Primary folder:

```text
server/
```

Do not edit patient UI or pitch deck except at integration breakpoints.

---

## Mission

Build the reliable engine behind the demo:

PDF/text input becomes validated `RecoveryPlan` JSON, and chat answers are grounded in that plan with medical safety boundaries.

---

## TDD Setup

Recommended tests:

- unit tests for each agent function
- route tests for `/api/recovery-plan`
- route tests for `/api/chat`
- schema validation tests
- safety filter tests

Minimum test cases:

1. Sample pneumonia note creates valid `RecoveryPlan`.
2. Missing medication dose appears in `missing_information`.
3. PDF extraction failure returns a fallback-friendly error.
4. Ibuprofen question returns `ask_doctor`.
5. Emergency symptoms return `emergency`.
6. Invalid model JSON falls back safely.

---

## Files To Create

Suggested structure:

```text
server/
├── src/
│   ├── index.js
│   ├── routes/
│   │   ├── recoveryPlanRoute.js
│   │   └── chatRoute.js
│   ├── agents/
│   │   ├── intakeAgent.js
│   │   ├── summaryAgent.js
│   │   ├── medicationAgent.js
│   │   ├── riskAgent.js
│   │   ├── educationAgent.js
│   │   └── composeRecoveryPlan.js
│   ├── services/
│   │   ├── geminiClient.js
│   │   ├── pdfTextExtractor.js
│   │   └── recoveryPlanValidator.js
│   ├── safety/
│   │   └── chatSafety.js
│   └── fixtures/
│       └── fallbackRecoveryPlan.js
└── tests/
    ├── recoveryPlanRoute.test.js
    ├── chatRoute.test.js
    ├── agents.test.js
    └── chatSafety.test.js
```

---

## API Contract

### `POST /api/recovery-plan`

Accept:

- PDF file
- pasted text
- sample mode flag

Return:

- validated recovery plan
- agent progress summaries
- warnings

### `POST /api/chat`

Accept:

- user question
- recovery plan JSON

Return:

- answer
- source
- safety level

---

## Agent Pipeline

Implement as plain functions:

```text
buildRecoveryPlan(inputText)
  -> runIntakeAgent(inputText)
  -> runSummaryAgent(intake)
  -> runMedicationAgent(intake)
  -> runRiskAgent(intake)
  -> runEducationAgent(intake, summary, meds, risks)
  -> composeRecoveryPlan(...)
  -> validateRecoveryPlan(plan)
```

Each function should be independently testable.

Use Gemini API calls during the real path. Keep a deterministic fallback path for demo reliability.

---

## Safety Rules

The backend must enforce:

- no diagnosis
- no medication dose changes
- no telling patient to stop medication
- no declaring ibuprofen or other added medications safe
- emergency symptoms trigger emergency guidance
- missing information triggers ask-doctor response

For medication questions:

```text
safetyLevel = "ask_doctor"
```

For severe breathing trouble, chest pain, confusion, blue lips, fainting, or oxygen below 90%:

```text
safetyLevel = "emergency"
```

---

## PDF Requirements

Support text-based PDFs.

If extraction fails, return:

```json
{
  "error": "PDF_TEXT_EXTRACTION_FAILED",
  "message": "We could not read this PDF reliably. Paste the discharge text or use the sample note for the demo."
}
```

OCR is out of scope.

---

## Breakpoints

### Hour 1

Confirm API route names and `RecoveryPlan` shape.

### Hour 3

Return valid fallback recovery plan from `/api/recovery-plan`.

### Hour 5

Gemini path works for sample pneumonia note.

### Hour 8

Freeze backend features. Only reliability fixes.

---

## Definition Of Done

- Server runs locally
- PDF or text input is accepted
- Gemini pipeline returns valid recovery plan
- fallback recovery plan exists
- chat endpoint answers ibuprofen safely
- emergency symptoms escalate
- no API keys committed
- Person 2 tests pass
