import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RecoveryDashboard from '../src/components/RecoveryDashboard.jsx';
import sampleRecoveryPlan from '../../../shared/sampleRecoveryPlan.json';

describe('RecoveryDashboard', () => {
  it('renders all required RecoveryPlan sections from the shared sample fixture', () => {
    render(<RecoveryDashboard plan={sampleRecoveryPlan} />);

    expect(screen.getByText(sampleRecoveryPlan.summary.title)).toBeInTheDocument();
    expect(screen.getByText(sampleRecoveryPlan.summary.what_happened)).toBeInTheDocument();
    expect(screen.getByText(sampleRecoveryPlan.summary.recovery_goal)).toBeInTheDocument();

    for (const task of sampleRecoveryPlan.today) {
      expect(screen.getByText(task.task)).toBeInTheDocument();
      expect(screen.getByText(task.why_it_matters)).toBeInTheDocument();
      expect(screen.getByText(task.source)).toBeInTheDocument();
    }

    for (const medication of sampleRecoveryPlan.medications) {
      expect(screen.getByText(medication.name)).toBeInTheDocument();
      expect(screen.getByText(medication.dose)).toBeInTheDocument();
      expect(screen.getByText(medication.timing)).toBeInTheDocument();
      expect(screen.getByText(medication.purpose)).toBeInTheDocument();
      expect(screen.getByText(medication.instructions)).toBeInTheDocument();
      expect(screen.getByText(medication.caution)).toBeInTheDocument();
    }

    const redFlags = screen.getByRole('region', { name: /red flags/i });
    for (const flag of sampleRecoveryPlan.red_flags) {
      expect(within(redFlags).getByText(flag.symptom)).toBeInTheDocument();
      expect(within(redFlags).getByText(flag.action)).toBeInTheDocument();
      expect(within(redFlags).getByText(flag.urgency.replace('_', ' '), { exact: false })).toBeInTheDocument();
    }

    for (const followUp of sampleRecoveryPlan.follow_ups) {
      expect(screen.getByText(followUp.task)).toBeInTheDocument();
      expect(screen.getByText(followUp.timeframe)).toBeInTheDocument();
      expect(screen.getByText(followUp.reason)).toBeInTheDocument();
    }

    for (const question of sampleRecoveryPlan.questions_for_clinician) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }

    for (const missingItem of sampleRecoveryPlan.missing_information) {
      expect(screen.getByText(missingItem)).toBeInTheDocument();
    }

    expect(screen.getByText(sampleRecoveryPlan.disclaimer)).toBeInTheDocument();
  });
});
