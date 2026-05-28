# Shared Contracts

This folder contains files that all three branches depend on.

Do not change these files casually during parallel work. If a shared file must change, stop at a breakpoint, announce the change, and make sure all three people update their branches.

## Files

- `recoveryPlan.schema.json`: canonical JSON shape returned by the backend and rendered by the patient app.
- `sampleRecoveryPlan.json`: deterministic fallback plan for frontend work and demo recovery.
- `sampleDischargeNote.txt`: default pneumonia discharge note for testing and demo.
- `agentProgress.json`: standard visible agent stages for the patient app.
- `goldenIbuprofenAnswer.txt`: expected safe chat answer for the demo question.

## Contract Rules

- The backend generates and validates `RecoveryPlan`.
- The patient app renders `RecoveryPlan`.
- The pitch deck may explain `RecoveryPlan` but should not modify the contract.
- Tests should import or copy these fixtures instead of inventing separate sample shapes.
