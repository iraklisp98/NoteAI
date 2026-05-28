# Person 2 Tasks: AI Backend

## Ownership

You own the Node.js recovery-plan backend pipeline: Gemini integration, PDF extraction, agent pipeline, validation, and fallback behavior.

Primary folder:

```text
server/
```

Do not edit patient UI, chat/safety backend scope, or pitch deck except at integration breakpoints.

---

## Mission

Build the reliable engine behind the demo:

PDF/text input becomes validated `RecoveryPlan` JSON that reliably powers dashboard rendering and chat grounding.

---

## TDD Setup

Recommended tests:

- unit tests for each agent function
- route tests for `/api/recovery-plan`
- schema validation tests
- fallback behavior tests

Minimum test cases:

1. Sample pneumonia note creates valid `RecoveryPlan`.
2. Missing medication dose appears in `missing_information`.
3. PDF extraction failure returns a fallback-friendly error.
4. Invalid model JSON falls back safely.
5. Recovery plan route returns deterministic fallback when AI path fails.

---

## Files To Create

Suggested structure:

```text
server/
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── recoveryPlanRoute.js
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
│   └── fixtures/
│       └── fallbackRecoveryPlan.js
└── tests/
    ├── recoveryPlanRoute.test.js
    ├── agents.test.js
    └── recoveryPlanValidator.test.js
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

## Coordination With Person 3

Person 3 owns `/api/chat`, conversation behavior, and safety guardrails.

Person 2 must provide:

- stable `RecoveryPlan` contract output
- fallback plan compatibility
- route/schema behavior that keeps chat grounding inputs valid

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

Gemini path works for sample pneumonia note and is ready for chat integration by Person 3.

### Hour 8

Freeze backend features. Only reliability fixes.

---

## Definition Of Done

- Server runs locally
- PDF or text input is accepted
- Gemini pipeline returns valid recovery plan
- fallback recovery plan exists
- no API keys committed
- Person 2 tests pass
