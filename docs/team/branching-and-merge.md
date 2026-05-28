# Branching And Merge Plan

## Branch Names

Use one branch per owner:

```text
person-1/patient-app
person-2/ai-backend
person-3/chat-safety
person-4/pitch-demo
```

Use short fix branches only after Hour 8:

```text
fix/demo-polish
fix/safety-copy
fix/pdf-fallback
```

---

## Ownership Rules

Person 1 owns:

```text
apps/patient/
```

Person 2 owns:

```text
server/src/agents/ (except conversationAgent.js)
server/src/services/
server/src/routes/recoveryPlanRoute.js
```

Person 3 owns:

```text
server/src/routes/chatRoute.js
server/src/safety/
server/src/agents/conversationAgent.js
```

Person 4 owns:

```text
apps/pitch/
docs/team/person-4-pitch-demo/
```

Shared files require breakpoint approval:

```text
shared/
.env.example
architecture.md
AGENTS.md
```

---

## TDD Merge Rule

Every branch should include:

1. Failing test first.
2. Small implementation.
3. Passing owned tests.
4. `ai.log` entry.
5. Short merge note explaining what changed.

Do not merge a branch that breaks another person's owned tests.

---

## Breakpoint Merge Order

### Hour 1: Contract Freeze

Merge only shared structure and contract files.

### Hour 3: Mock Integration

Merge:

- patient app rendering sample JSON
- backend returning sample JSON
- pitch deck skeleton

### Hour 5: AI Integration

Merge:

- Gemini backend pipeline
- patient app API integration
- chat safety path

### Hour 8: Demo Freeze

Merge only bug fixes, copy polish, and reliability improvements.

### Hour 9: Final Rehearsal

No more structural changes.

---

## Conflict Avoidance

- Do not format the whole repo.
- Do not move shared files after Hour 1.
- Do not rename API fields without team approval.
- Do not edit another person's owned folder to "help" unless they ask.
- If a conflict happens in a shared contract, stop and resolve as a team.

---

## Required Commit Shape

Keep commits small:

```text
test: add patient dashboard sample plan test
feat: render medication timeline
fix: return safe chat response for medication questions
docs: add insurance pitch slide copy
```
