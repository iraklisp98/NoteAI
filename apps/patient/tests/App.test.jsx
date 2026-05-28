import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import agentProgress from '../../../shared/agentProgress.json';
import sampleRecoveryPlan from '../../../shared/sampleRecoveryPlan.json';

const disclaimerText = /not a doctor and does not replace medical advice/i;
const jsxEntryFiles = [
  'src/App.jsx',
  'src/components/AgentProgress.jsx',
  'src/components/RecoveryChat.jsx',
  'src/components/RecoveryDashboard.jsx'
];

afterEach(() => {
  vi.restoreAllMocks();
});

async function signIn() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/username or email/i), 'admin');
  await user.type(screen.getByLabelText(/password/i), 'admin');
  await user.click(screen.getByRole('button', { name: /sign in to careflow/i }));
  return user;
}

async function signInWithEmail() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/username or email/i), 'admin@careflow.local');
  await user.type(screen.getByLabelText(/password/i), 'admin');
  await user.click(screen.getByRole('button', { name: /sign in to careflow/i }));
  return user;
}

describe('CAREFLOW patient app', () => {
  it('keeps React imported in JSX entry files for the deployed transform', () => {
    const sources = jsxEntryFiles.map((path) => readFileSync(path, 'utf8'));

    for (const source of sources) {
      expect(source).toMatch(/import React(?:,| from)/);
    }
  });

  it('starts on a patient-friendly login page before showing discharge tools', async () => {
    render(<App />);

    const identifierInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(screen.getByRole('heading', { name: /welcome to careflow/i })).toBeInTheDocument();
    expect(identifierInput).toHaveDisplayValue('');
    expect(passwordInput).toHaveDisplayValue('');
    expect(identifierInput).not.toHaveAttribute('placeholder', expect.stringMatching(/admin/i));
    expect(passwordInput).not.toHaveAttribute('placeholder', expect.stringMatching(/admin/i));
    expect(screen.queryByLabelText(/upload discharge pdf/i)).not.toBeInTheDocument();

    await signIn();

    expect(screen.getByLabelText(/upload discharge pdf/i)).toBeInTheDocument();
    expect(screen.getByText(disclaimerText)).toBeInTheDocument();
  });

  it('allows the default user to sign in with username or email', async () => {
    render(<App />);
    await signInWithEmail();

    expect(screen.getByLabelText(/upload discharge pdf/i)).toBeInTheDocument();
  });

  it('keeps the login page visible for credentials other than the default user', async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByLabelText(/username or email/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in to careflow/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid username or password/i);
    expect(screen.queryByLabelText(/upload discharge pdf/i)).not.toBeInTheDocument();
  });

  it('renders the empty upload state with PDF, paste, sample, and disclaimer controls', async () => {
    render(<App />);
    await signIn();

    expect(screen.getByRole('heading', { name: /careflow/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/upload discharge pdf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste discharge text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load sample pneumonia note/i })).toBeInTheDocument();
    expect(screen.getByText(disclaimerText)).toBeInTheDocument();
  });

  it('shows every shared agent progress stage while generating a recovery plan', async () => {
    const user = userEvent.setup();
    let resolvePlan;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolvePlan = () =>
              resolve({
                ok: true,
                json: async () => ({ plan: sampleRecoveryPlan, agents: agentProgress, warnings: [] })
              });
          })
      )
    );

    render(<App />);
    await signIn();
    await user.click(screen.getByRole('button', { name: /load sample pneumonia note/i }));

    const progress = screen.getByRole('region', { name: /agent progress/i });
    for (const stage of agentProgress) {
      expect(within(progress).getByText(stage.name)).toBeInTheDocument();
      expect(within(progress).getByText(stage.summary)).toBeInTheDocument();
    }

    resolvePlan();
    await screen.findByText(sampleRecoveryPlan.summary.title);
  });

  it('shows a PDF extraction fallback error while keeping paste and sample actions available', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          error: 'PDF_TEXT_EXTRACTION_FAILED',
          message: 'We could not read this PDF reliably. Paste the discharge text or use the sample note for the demo.'
        })
      }))
    );

    render(<App />);
    await signIn();
    await user.click(screen.getByRole('button', { name: /generate recovery plan/i }));

    expect(await screen.findByText(/we could not read this pdf reliably/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste discharge text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load sample pneumonia note/i })).toBeInTheDocument();
    expect(screen.getByText(disclaimerText)).toBeInTheDocument();
  });

  it('renders the full dashboard after the sample plan is loaded', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ plan: sampleRecoveryPlan, agents: agentProgress, warnings: [] })
      }))
    );

    render(<App />);
    await signIn();
    await user.click(screen.getByRole('button', { name: /load sample pneumonia note/i }));

    expect(await screen.findByRole('heading', { name: /recovery snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /today's plan/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /medication timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /red flags/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /follow-up checklist/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /questions for the clinician/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /missing information/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recovery chat/i })).toBeInTheDocument();
  });
});
