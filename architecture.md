# CAREFLOW Architecture

## Goal

CAREFLOW is a 10-hour TDD hackathon MVP. It converts a pneumonia discharge PDF into a patient-friendly recovery dashboard using a simple Gemini-powered agent pipeline.

The architecture is optimized for:

- parallel work by 4 people
- no file ownership overlap
- fast local demo
- safe medical boundaries
- predictable JSON contracts
- reliable fallback behavior

---

## System Overview

```text
Patient Browser
  |
  | React patient app
  | - PDF upload
  | - paste fallback
  | - agent progress
  | - recovery dashboard
  | - recovery chat
  |
  v
Node.js API Server
  |
  | /api/recovery-plan
  | /api/chat
  |
  v
Agent Pipeline
  |
  | parse PDF/text
  | intake agent
  | summary agent
  | medication agent
  | risk agent
  | education agent
  |
  v
RecoveryPlan JSON
  |
  | used by dashboard
  | used by chat grounding
  |
  v
Patient Guidance + Safety Escalation
```

Separate pitch deck:

```text
Pitch Deck Localhost App/Page
  |
  | problem
  | solution
  | agent architecture
  | insurance buyer story
  | safety
  | Android future
```

---

## Repo Ownership Boundaries

Use this split to avoid merge conflicts.

```text
apps/patient/                Person 1 only
server/src/agents/           Person 2 only
server/src/services/         Person 2 only
server/src/routes/recoveryPlanRoute.js  Person 2 only
server/src/routes/chatRoute.js          Person 3 only
server/src/safety/           Person 3 only
server/src/agents/conversationAgent.js  Person 3 only
apps/pitch/                  Person 4 only
docs/team/person-4-pitch-demo/ Person 4 only
shared/                      Contract files only, edited at breakpoints
docs/team/                   Planning docs only
```

Shared files are coordination points. Do not casually edit them during parallel work:

- `shared/recoveryPlan.schema.json`
- `shared/sampleRecoveryPlan.json`
- `shared/sampleDischargeNote.txt`
- `.env.example`
- root package/config files after scaffold

If a shared contract must change, pause at a breakpoint and announce it to the team.

---

## Recommended Project Structure

```text
.
├── AGENTS.md
├── architecture.md
├── second_prd.md
├── .gitignore
├── apps/
│   ├── patient/
│   │   ├── src/
│   │   └── tests/
│   └── pitch/
│       ├── src/
│       └── tests/
├── server/
│   ├── src/
│   │   ├── agents/
│   │   ├── routes/
│   │   ├── services/
│   │   └── safety/
│   └── tests/
├── shared/
│   ├── recoveryPlan.schema.json
│   ├── sampleRecoveryPlan.json
│   └── sampleDischargeNote.txt
└── docs/
    └── team/
        ├── person-1-patient-app/
        ├── person-2-ai-backend/
        ├── person-3-chat-safety/
        └── person-4-pitch-demo/
```

---

## Core Runtime Contracts

### `POST /api/recovery-plan`

Purpose:

- Accept PDF or pasted discharge text.
- Extract text.
- Run the agent pipeline.
- Return a validated `RecoveryPlan`.

Request:

```text
multipart/form-data
- file: optional PDF
- text: optional pasted discharge text
- useSample: optional boolean
```

Response:

```json
{
  "plan": {},
  "agents": [
    {
      "name": "Intake Agent",
      "status": "complete",
      "summary": "Extracted diagnosis, medications, follow-ups, and return precautions."
    }
  ],
  "warnings": []
}
```

Failure response:

```json
{
  "error": "PDF_TEXT_EXTRACTION_FAILED",
  "message": "We could not read this PDF reliably. Paste the discharge text or use the sample note for the demo."
}
```

### `POST /api/chat`

Purpose:

- Answer patient questions using the generated recovery plan.
- Enforce safety rules.

Request:

```json
{
  "question": "Can I take ibuprofen with these medications?",
  "plan": {}
}
```

Response:

```json
{
  "answer": "",
  "source": "Medication Timeline",
  "safetyLevel": "normal | ask_doctor | emergency"
}
```

---

## RecoveryPlan Contract

All rendering and chat grounding depend on this shape.

```json
{
  "summary": {
    "title": "",
    "what_happened": "",
    "recovery_goal": ""
  },
  "today": [
    {
      "task": "",
      "why_it_matters": "",
      "source": ""
    }
  ],
  "medications": [
    {
      "name": "",
      "dose": "",
      "timing": "",
      "purpose": "",
      "instructions": "",
      "caution": ""
    }
  ],
  "red_flags": [
    {
      "symptom": "",
      "action": "",
      "urgency": "emergency_now | call_today | monitor"
    }
  ],
  "follow_ups": [
    {
      "task": "",
      "timeframe": "",
      "reason": ""
    }
  ],
  "questions_for_clinician": [],
  "missing_information": [],
  "disclaimer": ""
}
```

Contract rule:

- The backend owns generating and validating this shape.
- The patient frontend owns rendering this shape.
- The pitch deck may reference this shape but must not modify it.

---

## Agent Pipeline

Use plain Node functions first.

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

Each agent should have:

- one function
- one prompt
- one unit test using sample pneumonia data
- one fallback response path

Do not let agent prompts leak into the frontend.

---

## TDD Rules

Every person follows red, green, refactor:

1. Write a failing test for the behavior.
2. Implement the smallest code to pass.
3. Refactor only inside owned files.
4. Run owned tests before pushing.
5. Integrate only at breakpoints.

Tests should prioritize demo-critical behavior:

- sample input creates valid recovery plan
- PDF failure gives paste/sample fallback
- dashboard renders every required section
- ibuprofen chat redirects to doctor/pharmacist
- emergency symptoms trigger emergency guidance
- pitch deck includes insurance and Android slides

---

## Parallel Breakpoints

### Breakpoint 1: Contract Freeze, Hour 1

Team agrees on:

- `RecoveryPlan` shape
- API route names
- sample pneumonia note
- app/pitch/server folder ownership

After this point, no one changes shared contracts without team approval.

### Breakpoint 2: Mock Integration, Hour 3

Expected state:

- frontend renders `sampleRecoveryPlan.json`
- backend returns valid sample JSON without Gemini if needed
- pitch deck has rough slide structure

Purpose:

- prove UI/backend/pitch can progress independently.

### Breakpoint 3: AI Integration, Hour 5

Expected state:

- backend can call Gemini
- backend has fallback plan if model output fails
- frontend can call `/api/recovery-plan`
- chat endpoint returns safe answer for ibuprofen question

Purpose:

- validate live demo path.

### Breakpoint 4: Demo Freeze, Hour 8

Expected state:

- no new features after this point
- only bug fixes, copy polish, and reliability work

Purpose:

- protect final demo from late breakage.

### Breakpoint 5: Final Rehearsal, Hour 9

Expected state:

- live AI path tested
- fallback path tested
- pitch deck tested
- speaking roles assigned

Purpose:

- enter demo with known path and backup path.

---

## Safety Architecture

Safety is enforced in three places:

1. Prompt instructions:
   - no diagnosis
   - no dose changes
   - no medication approval
   - preserve uncertainty

2. Backend safety filter:
   - medication change requests return `ask_doctor`
   - emergency symptom questions return `emergency`
   - missing data returns cautious fallback

3. Frontend display:
   - visible disclaimer
   - red flag section
   - chat answer source and safety level

Required disclaimer:

```text
CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.
```

---

## Demo Reliability Path

Primary path:

```text
PDF upload -> extract text -> Gemini pipeline -> dashboard -> chat
```

Fallback path 1:

```text
paste sample note -> Gemini pipeline -> dashboard -> chat
```

Fallback path 2:

```text
load sample recovery plan -> dashboard -> golden chat answer
```

The fallback path must look intentional, not broken. Label it as sample demo mode if needed.

---

## Definition Of Done

The architecture is implemented enough for demo when:

- patient app runs locally
- pitch deck runs locally
- server runs locally
- PDF or paste creates recovery dashboard
- fallback sample plan works
- chat answers the ibuprofen question safely
- disclaimer is visible
- tests pass for all owned areas
- no API keys are committed
