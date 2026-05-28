# CAREFLOW

CAREFLOW is a hackathon MVP that turns a hospital discharge PDF into a patient-friendly recovery workflow. The primary demo case is pneumonia discharge planning.

The app is a prototype only. It helps explain and organize discharge instructions, but it is not a doctor and does not replace medical advice. For emergencies, patients should call local emergency services. For medication changes or medical decisions, patients should contact a doctor or pharmacist.

## Team

- Iraklis Papigkiotis
- Nikos Bougialas
- Kostas Tsioupros

## Demo Goal

The demo should show that a confusing pneumonia discharge document can become a safe, structured recovery plan through a simple AI agent pipeline.

Required flow:

1. Upload a pneumonia discharge PDF, paste discharge text, or load the sample note.
2. Show visible progress through the intake, summary, medication, risk, and education agents.
3. Render a structured recovery dashboard for the patient.
4. Ask the recovery chat: `Can I take ibuprofen with these medications?`
5. Show a cautious answer grounded in the generated recovery plan.
6. Switch to the local pitch deck for the insurance buyer story.

## Project Layout

```text
apps/
  patient/   Patient-facing CAREFLOW app
  pitch/     Local pitch deck
server/
  src/       Node.js backend and API routes
  tests/     Backend tests
shared/      Shared contracts and notes
docs/        Planning and role documents
```

## Backend

The backend is a Node.js service with native `node:test` coverage.

```bash
cd server
npm test
```

Expected API surfaces:

- `POST /api/recovery-plan`
- `POST /api/chat`

Secrets must be provided through environment variables. Do not commit API keys. The intended AI provider is Gemini unless the team explicitly switches provider.

## Recovery Plan Contract

Dashboard rendering and chat grounding must use structured JSON, not free-form model prose. The shared recovery plan shape includes:

- `summary`
- `today`
- `medications`
- `red_flags`
- `follow_ups`
- `questions_for_clinician`
- `missing_information`
- `disclaimer`

## Development Rules

- Follow TDD for implementation work: write or update a failing test first, then make the smallest passing change.
- Record every meaningful AI-assisted repo change in `ai.log`.
- Keep prompts server-side.
- Validate model output before rendering it.
- Include deterministic fallback behavior so the demo still works if live AI, PDF parsing, or JSON formatting fails.

## Safety Boundaries

CAREFLOW may summarize discharge instructions, organize medication timing from the document, explain warning symptoms, suggest questions for clinicians, and help patients understand next steps.

CAREFLOW must not diagnose new conditions, prescribe medication, change doses, stop medication, guarantee drug safety, replace emergency services, or claim HIPAA or clinical compliance.


