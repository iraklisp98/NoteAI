# CAREFLOW AGENTS.md

## Project Mission

CAREFLOW is a 10-hour hackathon MVP that turns a hospital discharge PDF into an AI-orchestrated recovery plan for a patient.

The app must prove one thing clearly:

> A confusing pneumonia discharge document can become a safe, patient-friendly recovery workflow with specialized AI agents.

The end user is the patient. The buyer story is insurance companies that want fewer avoidable readmissions, better adherence, and clearer post-discharge coordination.

---

## Winning Constraints

- Build window: 10 hours
- Demo target: working localhost app
- Product name: CAREFLOW
- Primary demo condition: pneumonia
- Input: real PDF upload, with paste/sample fallback
- AI provider: Gemini API unless the team explicitly switches provider
- App stack: React + Node.js
- Agent style: simple pipeline first
- Pitch deck: separate localhost page/app
- Safety stance: prototype only, not medical advice

## Mandatory TDD

All implementation work must be done using TDD.

Rules:

- Write or update a failing test first.
- Implement the smallest change needed to make the test pass.
- Refactor only after tests pass.
- Do not merge code that is not covered by meaningful tests for the changed behavior.

If a decision does not improve the live demo, patient clarity, AI orchestration story, or insurance buyer story, cut it.

---

## Mandatory AI Change Log

Every AI-assisted repo change must be recorded in `ai.log`.

Append one entry per meaningful change using this template:

```text
Timestamp:
Model used:
What changed:
For what reason:
```

Rules:

- Update `ai.log` in the same work session as the repo change.
- Keep entries short and factual.
- Include documentation-only changes, code changes, config changes, generated assets, and test changes.
- Do not include secrets, API keys, private health data, or copied prompt contents that may contain sensitive data.
- If multiple files changed for the same reason, one entry is enough.

---

## Required Demo Flow

1. User opens CAREFLOW.
2. User uploads a pneumonia discharge PDF.
3. If PDF parsing fails, user can paste text or load the sample note.
4. The app shows visible agent progress.
5. Agents produce a structured recovery plan.
6. Dashboard renders the plan in patient-friendly sections.
7. User asks: "Can I take ibuprofen with these medications?"
8. Chat answers cautiously, uses the generated plan, and tells the user to ask a doctor or pharmacist.
9. Team switches to the separate pitch deck and explains the insurance market.

---

## MVP Product Surfaces

### Patient App

The patient app is the core demo.

Required sections:

- PDF upload area
- paste text fallback
- sample pneumonia note button
- agent progress timeline
- recovery snapshot
- today's plan
- medication timeline
- red flag warnings
- follow-up checklist
- recovery chat
- visible medical disclaimer

### Pitch Deck

The pitch deck should run on localhost as a separate page or simple app.

Required slides:

- problem: discharge confusion causes avoidable risk
- solution: AI-orchestrated recovery coordination
- demo case: pneumonia patient
- agent architecture
- patient experience
- insurance buyer value
- safety boundaries
- future Android implementation

---

## Agent Pipeline

Use a simple sequential pipeline. Do not start with LangGraph unless the pipeline is already working and there is spare time.

```text
PDF/Text Input
  -> Intake Agent
  -> Summary Agent
  -> Medication Agent
  -> Risk Agent
  -> Education Agent
  -> Recovery Plan JSON
  -> Conversation Agent
```

The UI may call these "agents" even if they are implemented as plain Node functions with separate prompts.

---

## Shared Recovery Plan Contract

All dashboard rendering and chat grounding should use this object shape.

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

Never let the frontend depend on free-form model prose. Parse and render structured JSON.

---

## Agent Specs

### Intake Agent

Goal:

- Extract facts from the discharge document.
- Preserve uncertainty.
- Identify missing or ambiguous details.

Inputs:

- raw discharge text

Outputs:

- diagnosis
- medications
- follow-ups
- return precautions
- home instructions
- allergies
- missing information

Rules:

- Do not invent missing data.
- If the PDF text is messy, extract only high-confidence information.
- Add unclear details to `missing_information`.

### Summary Agent

Goal:

- Translate the hospital stay into plain English.

Inputs:

- intake output
- raw discharge text if needed

Outputs:

- `summary.title`
- `summary.what_happened`
- `summary.recovery_goal`

Rules:

- Use patient-friendly language.
- Do not add new diagnoses.
- Keep the explanation concise enough for a dashboard.

### Medication Agent

Goal:

- Build a medication timeline and explain each medication.

Inputs:

- intake output

Outputs:

- `medications`
- medication-related `today` tasks
- medication-related `missing_information`

Rules:

- Do not change dose, timing, or duration.
- Do not claim complete drug interaction checking.
- If asked about adding a medication, direct the patient to a doctor or pharmacist.
- For the demo ibuprofen question, the safe answer should reference acetaminophen in the discharge plan and recommend asking a doctor or pharmacist before taking ibuprofen.

### Risk Agent

Goal:

- Turn return precautions into clear escalation guidance.

Inputs:

- intake output
- discharge return precautions

Outputs:

- `red_flags`

Urgency levels:

- `emergency_now`
- `call_today`
- `monitor`

Rules:

- Be conservative.
- Never tell the patient emergency care is unnecessary.
- Severe breathing trouble, chest pain, confusion, blue lips, fainting, or oxygen below 90% should be emergency guidance in the pneumonia demo.

### Education Agent

Goal:

- Convert instructions into practical patient tasks.

Inputs:

- summary
- medications
- red flags
- follow-ups

Outputs:

- `today`
- `follow_ups`
- `questions_for_clinician`

Rules:

- Keep language simple.
- Prefer concrete actions.
- Only include tasks supported by the discharge note or safe general recovery guidance.

### Conversation Agent

Goal:

- Answer patient questions using the generated recovery plan.

Inputs:

- user question
- recovery plan JSON

Outputs:

- conversational answer
- optional source section name
- optional safety escalation

Rules:

- Ground answers in the recovery plan.
- If information is missing, say it is missing.
- For medication changes, tell the user to ask a doctor or pharmacist.
- Refuse to diagnose new symptoms.
- Refuse to tell the user they do not need urgent care.
- Always escalate emergency symptoms.

---

## Safety Rules

Display this disclaimer in the app:

> CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.

The system must not:

- diagnose new conditions
- prescribe medication
- change medication dose
- stop medication
- guarantee drug safety
- replace emergency services
- claim HIPAA or clinical compliance

The system may:

- summarize uploaded discharge instructions
- organize medication timing from the document
- explain warning symptoms
- suggest questions for the doctor
- help patients understand what to do next

---

## PDF Requirements

PDF upload is required for the demo, but reliability matters more than perfect parsing.

Build order:

1. PDF upload UI
2. text extraction for normal text PDFs
3. paste fallback
4. sample note fallback

Out of scope:

- OCR for scanned PDFs
- handwritten notes
- complex multi-document merging

If uploaded PDF text extraction fails, show:

> We could not read this PDF reliably. Paste the discharge text or use the sample note for the demo.

---

## Gemini API Requirements

Use environment variables for secrets.

Required:

- never commit API keys
- add `.env` to `.gitignore`
- keep prompts server-side
- validate model output before rendering
- include a deterministic fallback recovery plan

Recommended endpoint shape:

```text
POST /api/recovery-plan
POST /api/chat
```

---

## Team Split

### Person 1: Patient App

Owns:

- React UI
- upload/paste/sample input
- agent progress timeline
- dashboard rendering
- chat panel
- disclaimer placement

Done when:

- the demo can be understood without explanation
- text does not overflow
- loading and error states are visible
- the patient dashboard feels polished

### Person 2: AI Backend

Owns:

- Node server
- Gemini API integration
- PDF text extraction
- agent prompts
- JSON validation
- fallback recovery plan
- chat grounding

Done when:

- sample pneumonia input produces valid JSON
- malformed model output does not crash the app
- chat refuses unsafe medication/dose requests
- API key is not committed

### Person 3: Pitch + Demo

Owns:

- separate localhost pitch deck
- insurance buyer story
- 90-second script
- future Android implementation plan
- sample PDF/note
- rehearsal checklist

Done when:

- the team can pitch without reading the PRD
- the buyer value is obvious
- the Android future path is credible
- there is a fallback plan if live AI fails

---

## 10-Hour Execution Plan

### Hour 0-1

- scaffold React app and Node server
- create `.env.example`
- add `.env` to `.gitignore`
- create sample pneumonia discharge text
- create placeholder pitch deck route/app

### Hour 1-3

- implement PDF upload and paste fallback
- implement `/api/recovery-plan`
- create agent prompts
- return valid recovery plan JSON

### Hour 3-5

- render dashboard sections
- add agent progress UI
- add fallback sample output
- test with sample pneumonia note

### Hour 5-6.5

- implement `/api/chat`
- ground chat in recovery plan
- test ibuprofen question
- add safety refusals

### Hour 6.5-8

- polish UI
- improve prompt outputs
- improve PDF failure handling
- ensure demo flow is smooth

### Hour 8-9

- finish pitch deck
- add insurance market story
- add Android future slide
- add architecture slide

### Hour 9-10

- freeze scope
- rehearse live demo
- test offline/fallback path
- prepare final speaking roles

---

## Future Android Plan

The Android app should reuse the same backend and recovery plan contract.

Future workflow:

1. Patient receives discharge paperwork.
2. Patient scans PDF or imports hospital document.
3. Backend extracts text and runs the same agent pipeline.
4. Android app displays recovery dashboard.
5. Push notifications remind patient about medications and follow-ups.
6. Chat remains grounded in the recovery plan.
7. Caregiver mode shares the plan with a trusted family member.
8. Insurance/care team dashboard tracks adherence and risk signals at an aggregate level.

Do not build Android during the hackathon. Show it as a credible next phase.

---

## Demo Reliability Rules

Always include:

- sample pneumonia PDF or text
- precomputed recovery plan fallback
- prewritten golden chat answer
- manual pitch backup

The live AI path is the main demo. The fallback path exists so the team does not lose the presentation if API latency, PDF parsing, or JSON formatting fails.

---

## Golden Demo Chat Answer

Question:

> Can I take ibuprofen with these medications?

Expected answer:

```text
I cannot confirm that ibuprofen is safe for you personally or tell you to add a medication. Your discharge plan lists amoxicillin/clavulanate, albuterol, and acetaminophen, and it specifically gives acetaminophen instructions for fever or discomfort.

Before taking ibuprofen, check with your doctor or pharmacist, especially if you have kidney disease, stomach ulcers or bleeding, take blood thinners, have heart failure, or were told to avoid NSAIDs.

If you have chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%, seek emergency care.
```

---

## Definition Of Done

The MVP is done when:

- a pneumonia PDF or sample input produces a dashboard
- at least five agents appear in the progress UI
- dashboard has summary, today, meds, red flags, follow-ups, and chat
- chat answers the ibuprofen question safely
- disclaimer is visible
- pitch deck runs locally
- insurance buyer story is clear
- future Android plan is included
- no API keys or local metadata are committed
