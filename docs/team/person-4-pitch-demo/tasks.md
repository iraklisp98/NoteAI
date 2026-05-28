# Person 4 Tasks: Pitch Deck And Demo

## Ownership

You own the separate localhost pitch deck, demo script, sample assets, insurance buyer story, and Android future plan.

Primary folder:

```text
apps/pitch/
```

Planning docs may live in:

```text
docs/team/person-4-pitch-demo/
```

Do not edit patient app or backend implementation except at integration breakpoints.

---

## Mission

Make the project easy to understand and hard to dismiss.

The pitch must explain:

- why discharge is a real problem
- why AI agents are appropriate
- why patients benefit
- why insurance companies would care
- why the prototype is safe
- how the Android app comes next

---

## TDD Setup

Recommended tests:

- pitch route renders all required slides
- slide titles appear in order
- insurance value slide exists
- Android future slide exists
- safety disclaimer slide exists

Minimum test cases:

1. Pitch deck renders without crashing.
2. Contains problem, solution, architecture, insurance, safety, and Android sections.
3. Demo script includes live path and fallback path.
4. Sample note file exists.
5. Golden ibuprofen answer exists.

---

## Files To Create

Suggested structure:

```text
apps/pitch/
├── src/
│   ├── PitchApp.jsx
│   ├── slides/
│   │   ├── ProblemSlide.jsx
│   │   ├── SolutionSlide.jsx
│   │   ├── ArchitectureSlide.jsx
│   │   ├── DemoFlowSlide.jsx
│   │   ├── InsuranceValueSlide.jsx
│   │   ├── SafetySlide.jsx
│   │   └── AndroidFutureSlide.jsx
│   └── content/
│       └── pitchCopy.js
└── tests/
    └── PitchApp.test.jsx
```

Planning docs:

```text
docs/team/person-4-pitch-demo/
├── demo-script.md
├── insurance-story.md
├── android-future.md
└── rehearsal-checklist.md
```

---

## Required Pitch Sections

### 1. Problem

Discharge is a dangerous handoff. Patients leave with dense instructions, medication changes, red flags, and follow-up tasks.

### 2. Solution

CAREFLOW turns discharge paperwork into an AI-orchestrated recovery workflow.

### 3. Live Demo

Show:

- PDF upload
- agent pipeline
- recovery dashboard
- ibuprofen chat question

### 4. Agent Architecture

Explain:

- Intake Agent
- Summary Agent
- Medication Agent
- Risk Agent
- Education Agent
- Conversation Agent

### 5. Insurance Buyer Value

Insurance companies care because CAREFLOW can help reduce:

- avoidable readmissions
- medication confusion
- missed follow-ups
- unnecessary support calls
- unmanaged post-discharge risk

### 6. Safety

This is a prototype. It does not diagnose, prescribe, or replace doctors. Medication decisions are redirected to a doctor or pharmacist.

### 7. Future Android Plan

The Android version reuses the same backend and recovery plan contract:

- scan/import discharge PDF
- show recovery plan
- send medication and follow-up reminders
- caregiver sharing
- insurance/care team risk dashboard later

---

## Demo Script

Use this 90-second structure:

1. "Discharge is one of healthcare's most fragile handoffs."
2. "Patients leave with dense paperwork and are expected to manage recovery alone."
3. "CAREFLOW turns that paperwork into a coordinated recovery plan."
4. Upload the pneumonia PDF.
5. Show agents running.
6. Show dashboard sections.
7. Ask: "Can I take ibuprofen with these medications?"
8. Explain safe answer and doctor/pharmacist redirect.
9. Close with insurance value: fewer avoidable readmissions and better recovery coordination.

---

## Breakpoints

### Hour 1

Confirm final product name, buyer story, and demo patient.

### Hour 3

Pitch deck has rough slide structure.

### Hour 5

Demo script matches working app flow.

### Hour 8

Freeze pitch content. Only polish wording.

### Hour 9

Run full rehearsal with live path and fallback path.

---

## Definition Of Done

- Pitch deck runs locally
- Slides include problem, solution, architecture, insurance value, safety, and Android future
- Demo script is written
- fallback script is written
- sample pneumonia note/PDF is ready
- golden ibuprofen answer is ready
- Person 4 tests pass

