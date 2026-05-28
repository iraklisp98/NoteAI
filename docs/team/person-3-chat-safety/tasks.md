# Person 3 Tasks: Chat And Safety Backend

## Ownership

You own the chat and safety backend implementation only.

Primary scope:

```text
server/src/routes/chatRoute.js
server/src/safety/
server/src/agents/conversationAgent.js
server/tests/chat*
```

Do not edit patient UI, recovery-plan backend pipeline, or pitch deck implementation except at integration breakpoints.

---

## Mission

Build the safe conversation path behind the demo:

- grounded patient chat using RecoveryPlan JSON
- strict medication/symptom safety behavior
- deterministic fallback for the ibuprofen demo question

---

## TDD Setup

Recommended tests:

- unit tests for chat safety classifier
- route tests for `/api/chat`
- tests for missing information handling
- tests for emergency symptom escalation

Minimum test cases:

1. Ibuprofen question returns `ask_doctor`.
2. Emergency symptoms return `emergency`.
3. Missing plan medication data triggers safe uncertainty language.
4. Chat refuses medication dose changes.
5. Chat route remains stable for malformed input.

---

## API Contract

### `POST /api/chat`

Accept:

- user question
- recovery plan JSON

Return:

- answer
- source
- safety level

Safety levels:

```text
normal
ask_doctor
emergency
```

---

## Safety Rules

The backend must enforce:

- no diagnosis of new conditions
- no medication additions or dose changes
- no telling patient urgent care is unnecessary
- emergency symptoms always escalate
- medication-interaction questions route to doctor or pharmacist

For severe breathing trouble, chest pain, confusion, blue lips, fainting, or oxygen below 90%:

```text
safetyLevel = "emergency"
```

---

## Breakpoints

### Hour 3

Chat safety test suite scaffolding complete.

### Hour 5

`/api/chat` integrated with RecoveryPlan contract.

### Hour 8

Chat behavior frozen; only safety/reliability bug fixes.

---

## Definition Of Done

- `/api/chat` works locally
- ibuprofen answer is safe and grounded
- emergency escalation works
- medication-change requests are refused safely
- malformed input does not crash endpoint
- Person 3 tests pass
