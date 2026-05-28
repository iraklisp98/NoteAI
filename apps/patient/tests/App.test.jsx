import { render, screen } from '@testing-library/react';
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
    expect(screen.getAllByText(disclaimerText).length).toBeGreaterThan(0);
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

  it('renders the empty upload state with PDF, paste, and disclaimer controls', async () => {
    render(<App />);
    await signIn();

    expect(screen.getByRole('heading', { name: /careflow/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/upload discharge pdf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste discharge text/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load sample pneumonia note/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(disclaimerText).length).toBeGreaterThan(0);
  });

  it('sends the uploaded PDF to the recovery-plan endpoint when generating a plan', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ plan: sampleRecoveryPlan, agents: agentProgress, warnings: [] })
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    const file = new File(['%PDF-1.4 discharge'], 'discharge-summary.pdf', {
      type: 'application/pdf'
    });
    await user.upload(screen.getByLabelText(/upload discharge pdf/i), file);
    await user.type(screen.getByLabelText(/paste discharge text/i), 'Backup text should be ignored when file exists.');
    await user.click(screen.getByRole('button', { name: /generate recovery plan/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0];
    const body = fetchMock.mock.calls[0][1].body;
    expect(request).toBe('/api/recovery-plan');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBeInstanceOf(File);
    expect(body.get('file').name).toBe('discharge-summary.pdf');
    expect(body.get('text')).toContain('Backup text should be ignored');
    expect(await screen.findByText(sampleRecoveryPlan.summary.title)).toBeInTheDocument();
  });

  it('uses paste discharge text when no upload is provided', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ plan: sampleRecoveryPlan, agents: agentProgress, warnings: [] })
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    await user.type(
      screen.getByLabelText(/paste discharge text/i),
      'Discharge diagnosis: pneumonia. Continue antibiotics.'
    );
    await user.click(screen.getByRole('button', { name: /generate recovery plan/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = fetchMock.mock.calls[0][1].body;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBeNull();
    expect(body.get('text')).toContain('Discharge diagnosis: pneumonia');
    expect(await screen.findByText(sampleRecoveryPlan.summary.title)).toBeInTheDocument();
    expect(screen.getAllByText(disclaimerText).length).toBeGreaterThan(0);
  });

  it('renders the full dashboard after pasted discharge text is submitted', async () => {
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
    await user.type(
      screen.getByLabelText(/paste discharge text/i),
      'Discharge diagnosis: pneumonia. Continue antibiotics.'
    );
    await user.click(screen.getByRole('button', { name: /generate recovery plan/i }));

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
