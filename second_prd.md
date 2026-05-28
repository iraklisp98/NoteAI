# CAREFLOW

## AI-Orchestrated Post-Discharge Recovery Platform

### Hackathon MVP PRD

Version 2.0

---

## One-Line Pitch

CAREFLOW turns confusing hospital discharge paperwork into a personalized, AI-coordinated recovery plan that patients and caregivers can actually follow.

---

## Winning Thesis

Hospital discharge is one of healthcare's highest-friction handoffs. Patients leave with dense documents, medication changes, warning symptoms, and follow-up tasks, then are expected to coordinate recovery on their own.

Most healthcare AI demos summarize documents or answer generic questions. CAREFLOW goes further: it decomposes discharge recovery into specialized tasks, runs coordinated agents over the same patient state, and produces a recovery command center for the patient, caregiver, and care team.

The hackathon win condition is simple:

> Show judges a static discharge note becoming an active recovery workflow in under 90 seconds.

---

## The Problem

Hospital discharge is not a paperwork problem. It is a coordination problem.

Patients and caregivers must understand:

- what happened in the hospital
- which medications changed
- when and how to take each medication
- which symptoms are dangerous
- what follow-up appointments or tests are required
- when to call a clinician, urgent care, or emergency services

The current experience is often:

> "Here is a PDF. Good luck."

That gap causes medication errors, missed follow-ups, preventable complications, avoidable support calls, and costly readmissions.

---

## Target Users

### Primary User

Recently discharged patients and their caregivers.

### Buyer / Partner

Hospitals, clinics, care coordination teams, telehealth providers, and payers.

### Hackathon Demo Persona

Maria, 67, was discharged after pneumonia. Her daughter helps at home. They receive a discharge summary with antibiotics, inhaler instructions, warning symptoms, and a primary-care follow-up.

Maria and her daughter need to know:

- what happened
- what to do today
- what medicines to take and when
- which symptoms require urgent help
- whether common over-the-counter medicines are safe to ask about

---

## Product Promise

CAREFLOW provides a recovery plan that is:

- patient-friendly
- medication-aware
- risk-aware
- follow-up-aware
- conversational
- grounded in the uploaded discharge information

CAREFLOW is not a diagnosis tool and does not replace a clinician. It coordinates and explains the discharge plan, highlights risks, and prompts patients to seek medical help when appropriate.

---

## MVP Scope

### Must Have

- Paste or upload a discharge note
- Run a visible multi-agent orchestration flow
- Extract structured patient recovery data
- Generate a patient-friendly recovery dashboard
- Build a medication schedule
- Identify red-flag symptoms and escalation guidance
- Support contextual recovery chat over the generated plan
- Display safety disclaimers and escalation boundaries

### Nice To Have

- PDF parsing
- OCR
- Caregiver view
- Multilingual output
- Voice readout
- Calendar export
- SMS reminders

### Explicitly Out Of Scope For Hackathon

- Authentication
- EHR integration
- Real medication interaction engine
- Billing workflows
- Clinician inbox
- Persistent database
- HIPAA production compliance
- Real patient deployment

### Scope Rule

If a feature does not improve the 90-second demo, the judge narrative, or the core recovery workflow, cut it.

---

## Core Demo Flow

### 1. Start With A Realistic Discharge Note

The user pastes or uploads a discharge summary for pneumonia.

The note includes:

- diagnosis
- discharge medications
- follow-up instructions
- return precautions
- allergies or risk factors

### 2. Show Agent Orchestration

The UI displays a live workflow:

- Intake Agent extracts clinical facts
- Summary Agent translates the hospital stay
- Medication Agent builds a schedule
- Risk Agent identifies red flags
- Education Agent rewrites instructions for patient literacy
- Chat Agent prepares grounded Q&A

This is the visual proof that CAREFLOW is not just a chatbot.

### 3. Reveal The Recovery Dashboard

The dashboard shows:

- "What happened"
- "What to do today"
- medication schedule
- warning symptoms
- follow-up tasks
- questions to ask the doctor

### 4. Deliver The Wow Moment

The user asks:

> Can I take ibuprofen with these medications?

CAREFLOW answers in a grounded, cautious way:

- references the patient's medications from the discharge plan
- avoids definitive unsafe medical claims
- recommends checking with the clinician or pharmacist
- suggests safer next actions
- escalates if symptoms indicate danger

### 5. Close With The Business Value

CAREFLOW reduces confusion after discharge, improves adherence, and gives care teams a scalable recovery coordination layer.

---

## User Experience Requirements

### First Screen

The first screen must be the product, not a marketing page.

Required layout:

- left panel: discharge note input
- center/right panel: generated recovery dashboard
- bottom or side panel: recovery chat
- visible agent progress during generation

### Dashboard Sections

1. Recovery Snapshot
   - plain-English diagnosis
   - why the patient was hospitalized
   - current recovery goal

2. Today's Plan
   - medication tasks
   - activity guidance
   - hydration/diet instructions if present
   - follow-up reminders

3. Medication Timeline
   - medicine name
   - dose
   - timing
   - purpose
   - important instructions
   - "ask clinician/pharmacist" flags

4. Red Flags
   - emergency symptoms
   - call-doctor symptoms
   - expected but monitor symptoms

5. Follow-Up Checklist
   - appointment type
   - recommended timing
   - tests or labs if present
   - open questions

6. Recovery Chat
   - answers only from the recovery plan plus general safety guidance
   - cites which section of the plan it used
   - refuses diagnosis, dosage changes, or emergency triage beyond safe escalation

---

## Agent Architecture

CAREFLOW uses specialized agents that read and enrich a shared recovery state. The agents do not act as independent chatbots. They are workflow steps in a coordinated recovery pipeline.

### 1. Intake Agent

Purpose:

- parse discharge text
- extract structured medical facts
- identify missing or ambiguous information

Output fields:

```json
{
  "patient_context": {
    "age": null,
    "sex": null,
    "allergies": [],
    "risk_factors": []
  },
  "hospitalization": {
    "primary_diagnosis": "",
    "secondary_diagnoses": [],
    "procedures": [],
    "key_results": []
  },
  "medications": [],
  "follow_ups": [],
  "return_precautions": [],
  "home_instructions": [],
  "unknowns": []
}
```

### 2. Summary Agent

Purpose:

- translate clinical language into plain English
- explain what happened and why recovery matters
- preserve uncertainty when the document is unclear

### 3. Medication Agent

Purpose:

- normalize medication list
- create a daily schedule
- explain each medication's purpose
- flag missing dose, route, frequency, or duration
- warn users not to change medications without clinician guidance

MVP limitation:

- The demo may use model reasoning for simple medication cautions, but must not claim to perform complete interaction checking.

### 4. Risk Agent

Purpose:

- extract red flags from discharge instructions
- classify escalation level
- add conservative safety guidance

Escalation levels:

- Emergency now
- Call clinician today
- Monitor and mention at follow-up

### 5. Education Agent

Purpose:

- rewrite guidance at a patient-friendly reading level
- produce caregiver-friendly instructions
- convert vague instructions into concrete tasks when supported by the discharge note

### 6. Conversation Agent

Purpose:

- answer patient questions using the recovery state
- cite the relevant plan section in plain language
- avoid diagnosis, medication changes, or false certainty
- escalate when symptoms suggest urgent risk

---

## Shared Recovery State

The shared state is the product's backbone.

```json
{
  "source_text": "",
  "extracted_data": {},
  "plain_summary": "",
  "medication_schedule": [],
  "risk_guidance": [],
  "follow_up_tasks": [],
  "patient_education": [],
  "chat_context": {
    "allowed_topics": [],
    "blocked_topics": [],
    "safety_rules": []
  },
  "confidence": {
    "missing_medication_details": [],
    "ambiguous_instructions": [],
    "requires_human_review": []
  }
}
```

Why this matters:

- judges can see the architecture
- the app can render predictable UI
- chat answers stay grounded
- each agent contributes a specific layer of value

---

## Safety Guardrails

### Product Boundaries

CAREFLOW does:

- explain discharge instructions
- organize recovery tasks
- highlight warning symptoms from the discharge plan
- encourage appropriate follow-up
- help patients prepare questions for clinicians

CAREFLOW does not:

- diagnose new conditions
- prescribe medication
- change medication dose or timing
- replace emergency services
- guarantee medication safety
- provide production clinical decision support

### Required Safety Copy

Display this near the dashboard and chat:

> CAREFLOW helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your clinician or pharmacist.

### Chat Refusal Rules

The chat must refuse or redirect when asked to:

- change a dose
- stop a medication
- diagnose new symptoms
- decide whether emergency care is unnecessary
- override discharge instructions

Example response:

> I cannot tell you to change or stop a medication. Based on your discharge plan, this medicine was prescribed for recovery. Please contact your clinician or pharmacist before making changes.

---

## Technical Stack

### Recommended MVP Stack

- Frontend: Next.js + React + TailwindCSS
- Backend: FastAPI or Next.js API routes
- Agent orchestration: LangGraph or a simple typed pipeline
- Model: GPT-4o, GPT-4.1, Claude Sonnet, or equivalent
- Storage: in-memory session state or local JSON for demo

### Recommended Build Choice

For a 12-hour hackathon, use a simple pipeline that behaves like a multi-agent system even if LangGraph setup becomes slow:

```text
input discharge note
  -> intake extraction
  -> summary generation
  -> medication schedule generation
  -> risk guidance generation
  -> education rewrite
  -> recovery plan JSON
  -> grounded chat
```

This preserves the product story and avoids framework risk.

---

## Data Contract For MVP

The frontend should render this object:

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
  "missing_information": []
}
```

---

## Prompting Requirements

Every agent prompt should include:

- role and task
- source discharge text or current recovery state
- required JSON output shape
- instruction to preserve uncertainty
- instruction not to invent missing data
- safety boundary

### Intake Prompt Principle

Extract only what appears in the source. If a medication dose, frequency, allergy, or follow-up time is missing, put it in `missing_information`.

### Chat Prompt Principle

Answer using the recovery plan. If the plan does not contain enough information, say what is missing and recommend contacting the appropriate clinician or pharmacist.

---

## Demo Dataset

Use one polished synthetic discharge note. It should be realistic enough to show value but simple enough to avoid clinical complexity.

Recommended case:

- pneumonia
- oral antibiotic
- rescue inhaler
- acetaminophen as needed
- primary-care follow-up in 3-5 days
- return precautions for breathing trouble, chest pain, high fever, confusion, worsening symptoms

Avoid cases involving:

- cancer
- pregnancy
- pediatrics
- anticoagulants
- insulin
- opioids
- psychiatric crisis
- complex renal dosing

These add safety and accuracy risk without improving the hackathon demo.

---

## Success Metrics

### Demo Metrics

- time from upload to dashboard: under 30 seconds
- number of visible agents: at least 5
- generated plan sections: at least 5
- chat answer references recovery context
- judges understand the product in under 20 seconds

### Product Metrics

- discharge comprehension
- medication adherence
- follow-up completion
- reduction in avoidable support calls
- reduction in preventable readmission risk
- patient satisfaction after discharge

---

## Competitive Positioning

### Not Another Medical Chatbot

Medical chatbots answer questions. CAREFLOW builds a recovery workflow.

### Not Just Summarization

Summaries explain documents. CAREFLOW converts documents into tasks, schedules, risk guidance, and contextual support.

### Not A Hospital Portal

Portals store information. CAREFLOW actively coordinates what the patient needs to do next.

---

## Business Case

CAREFLOW can become infrastructure for post-discharge care coordination.

Value drivers:

- fewer preventable readmissions
- fewer confused patient calls
- better medication adherence
- better follow-up completion
- improved patient experience scores
- scalable care management support

Initial go-to-market:

- pilot with clinics or discharge coordination teams
- start with one condition pathway, such as pneumonia or heart failure
- integrate into care team workflow after validating patient-facing MVP

---

## 12-Hour Build Plan

### Hours 0-1: Product Skeleton

- create app shell
- build two-pane layout
- add sample discharge note
- define recovery plan JSON contract

### Hours 1-3: Agent Pipeline

- implement agent functions
- generate structured JSON
- add progress states
- add fallback sample output

### Hours 3-5: Dashboard

- render summary
- render medication schedule
- render red flags
- render follow-up tasks
- add missing-information warnings

### Hours 5-7: Chat

- ground chat in generated recovery plan
- add safety refusal rules
- test wow questions

### Hours 7-9: Demo Polish

- improve visual hierarchy
- add agent activity animation
- tune sample discharge note
- tune prompts and outputs

### Hours 9-11: Reliability

- add loading and error states
- add deterministic fallback
- test with sample input multiple times
- make sure demo works without network if possible

### Hour 11-12: Pitch Prep

- rehearse 90-second demo
- prepare judging story
- capture screenshots
- write backup talking points

---

## Failure Modes And Fallbacks

### Model Output Is Invalid JSON

Fallback:

- retry once with stricter JSON instruction
- if still invalid, use canned demo output and show a "demo fallback" state

### Upload Parsing Fails

Fallback:

- support paste input as the primary path
- include one-click sample discharge note

### Chat Gives Unsafe Advice

Fallback:

- add post-processing safety filter
- block medication changes and emergency dismissal language
- show safe escalation response

### Agent Framework Takes Too Long

Fallback:

- implement agents as plain functions with separate prompts
- keep visible orchestration in the UI

### Demo Internet Fails

Fallback:

- include cached sample recovery plan
- demo the flow using precomputed output

---

## Judge Narrative

Use this story:

1. "Discharge is one of healthcare's most fragile handoffs."
2. "Patients get dense paperwork and are expected to manage recovery alone."
3. "CAREFLOW turns that paperwork into a coordinated recovery plan."
4. "Specialized agents extract facts, simplify the stay, organize medications, identify risks, and prepare patient education."
5. "The patient gets a dashboard and a chat assistant grounded in their discharge plan."
6. "This is not a doctor and not a diagnosis engine. It is coordination infrastructure for safer recovery."
7. "Hospitals care because confusion after discharge drives calls, complications, and readmissions."

---

## 90-Second Pitch Script

Discharge is one of the most dangerous moments in healthcare. A patient leaves the hospital with a packet of instructions, new medications, warning symptoms, and follow-up tasks, then has to coordinate recovery at home.

CAREFLOW turns that packet into an AI-orchestrated recovery workflow.

Here is a sample discharge note for a pneumonia patient. When we upload it, CAREFLOW runs specialized agents: one extracts clinical facts, one translates the hospital stay, one organizes medications, one identifies red flags, and one creates patient-friendly education.

The result is a recovery dashboard: what happened, what to do today, when to take each medication, when to call the doctor, and when symptoms may be an emergency.

The patient can also ask questions. If they ask whether they can take ibuprofen, CAREFLOW answers from the recovery plan, stays within safety boundaries, and directs them to a clinician or pharmacist for medication decisions.

This is not a medical chatbot. It is post-discharge coordination infrastructure.

---

## Demo Appendix

### Synthetic Discharge Note

Use this as the default sample input:

```text
Patient: Maria Lopez, 67-year-old female
Admission reason: Shortness of breath, fever, and productive cough
Discharge diagnosis: Community-acquired pneumonia, improving

Hospital course:
Patient was treated with IV antibiotics and breathing treatments. Oxygen levels improved and she is stable for discharge home. Chest X-ray showed right lower-lobe pneumonia. Blood cultures showed no growth.

Discharge medications:
1. Amoxicillin/clavulanate 875/125 mg by mouth twice daily for 5 days.
2. Albuterol inhaler: 2 puffs every 4-6 hours as needed for wheezing or shortness of breath.
3. Acetaminophen 500 mg by mouth every 6 hours as needed for fever or discomfort. Do not exceed 3,000 mg per day.

Home instructions:
Rest, drink fluids, and avoid smoking or secondhand smoke. Use the inhaler only as directed. Finish the full antibiotic course even if feeling better.

Follow-up:
See primary care clinician in 3-5 days. Repeat chest imaging may be considered if symptoms do not improve.

Return precautions:
Seek emergency care for severe trouble breathing, chest pain, blue lips, confusion, fainting, or oxygen level below 90% if using a home pulse oximeter. Call clinician for fever above 101.5 F, worsening cough, inability to keep fluids down, rash, severe diarrhea, or symptoms not improving after 48-72 hours.

Allergies:
No known drug allergies listed.
```

### Golden Chat Question

Question:

> Can I take ibuprofen with these medications?

Expected answer shape:

```text
I cannot confirm that ibuprofen is safe for you personally or tell you to add a medication. Your discharge plan lists amoxicillin/clavulanate, albuterol, and acetaminophen, and it specifically gives acetaminophen instructions for fever or discomfort.

Before taking ibuprofen, check with your clinician or pharmacist, especially if you have kidney disease, stomach ulcers or bleeding, take blood thinners, have heart failure, or were told to avoid NSAIDs.

If you have chest pain, severe trouble breathing, confusion, blue lips, fainting, or oxygen below 90%, seek emergency care.
```

Why this wins:

- it uses the patient's plan
- it avoids unsafe medication approval
- it gives practical next steps
- it demonstrates safety boundaries
- it ends with escalation guidance

---

## Final Positioning

CAREFLOW transforms hospital discharge from passive paperwork into active AI-orchestrated recovery coordination.

For the hackathon, the winning demo is not breadth. It is clarity:

- one realistic patient
- one painful workflow
- one strong orchestration story
- one beautiful dashboard
- one safe, contextual wow question 
