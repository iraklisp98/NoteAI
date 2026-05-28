# Person 1 Tasks: Patient App

## Ownership

You own the React patient app only.

Primary folder:

```text
apps/patient/
```

Do not edit backend agent logic, pitch deck slides, or shared contracts except at team breakpoints.

---

## Mission

Build the demo experience the judges will touch first:

PDF upload, paste fallback, visible agent progress, recovery dashboard, chat panel, and medical disclaimer.

The UI must make CAREFLOW feel like a real recovery coordination product, not a generic chatbot.

---

## TDD Setup

Recommended tests:

- component tests for dashboard sections
- component tests for upload/paste states
- API mocking tests for recovery plan and chat
- smoke test for full demo flow using sample data

Minimum test cases:

1. Renders empty upload state.
2. Renders all dashboard sections from `sampleRecoveryPlan`.
3. Shows agent progress while generating.
4. Shows PDF extraction fallback error.
5. Sends chat question and displays answer.
6. Disclaimer is always visible.

---

## Files To Create

Suggested structure:

```text
apps/patient/
├── src/
│   ├── App.jsx
│   ├── api/
│   │   └── careflowApi.js
│   ├── components/
│   │   ├── UploadPanel.jsx
│   │   ├── AgentProgress.jsx
│   │   ├── RecoveryDashboard.jsx
│   │   ├── MedicationTimeline.jsx
│   │   ├── RedFlags.jsx
│   │   ├── FollowUps.jsx
│   │   ├── RecoveryChat.jsx
│   │   └── Disclaimer.jsx
│   └── fixtures/
│       └── sampleRecoveryPlan.js
└── tests/
    ├── App.test.jsx
    ├── RecoveryDashboard.test.jsx
    └── RecoveryChat.test.jsx
```

---

## Required UI States

### Empty State

- Product name: CAREFLOW
- PDF upload control
- paste discharge text area
- "Load sample pneumonia note" action
- visible disclaimer

### Loading State

Show these stages:

- Reading discharge document
- Intake Agent extracting medical facts
- Summary Agent translating the hospital stay
- Medication Agent building schedule
- Risk Agent identifying red flags
- Education Agent creating patient guidance
- Preparing recovery chat

### Dashboard State

Render:

- recovery snapshot
- today's plan
- medication timeline
- red flags
- follow-up checklist
- questions for clinician
- missing information
- chat panel

### Error State

If PDF parsing or AI fails:

- explain the issue simply
- keep paste fallback available
- keep sample plan fallback available

---

## API Dependencies

Use these endpoints:

```text
POST /api/recovery-plan
POST /api/chat
```

Until the backend is ready, mock both endpoints with `sampleRecoveryPlan`.

Do not block on Person 2.

---

## Breakpoints

### Hour 1

Confirm `RecoveryPlan` shape with team.

### Hour 3

Patient app renders a full dashboard from local sample JSON.

### Hour 5

Patient app calls backend `/api/recovery-plan` and `/api/chat`.

### Hour 8

Freeze UI features. Only polish and bug fixes.

---

## Definition Of Done

- Upload/paste/sample flow exists
- Dashboard renders all required sections
- Chat UI works with mocked or real backend
- Agent progress is visible and demo-friendly
- Disclaimer is visible
- UI handles loading and errors
- Person 1 tests pass

