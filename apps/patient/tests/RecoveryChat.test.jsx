import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RecoveryChat from '../src/components/RecoveryChat.jsx';
import sampleRecoveryPlan from '../../../shared/sampleRecoveryPlan.json';
import goldenIbuprofenAnswer from '../../../shared/goldenIbuprofenAnswer.txt?raw';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RecoveryChat', () => {
  it('sends a patient question with the current recovery plan and displays the grounded answer', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        answer: goldenIbuprofenAnswer,
        source: 'Medication Timeline',
        safetyLevel: 'ask_doctor'
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RecoveryChat plan={sampleRecoveryPlan} />);

    await user.type(screen.getByLabelText(/ask a recovery question/i), 'Can I take ibuprofen with these medications?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Can I take ibuprofen with these medications?',
          plan: sampleRecoveryPlan
        })
      })
    );
    expect(await screen.findByText(goldenIbuprofenAnswer, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/source: medication timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/ask doctor/i)).toBeInTheDocument();
  });

  it('keeps the medical disclaimer visible beside chat', () => {
    render(<RecoveryChat plan={sampleRecoveryPlan} />);

    expect(screen.getByText(/not a doctor and does not replace medical advice/i)).toBeInTheDocument();
  });
});
