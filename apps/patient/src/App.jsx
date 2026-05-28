import React, { useState } from 'react';
import agentProgress from '../../../shared/agentProgress.json';
import sampleRecoveryPlan from '../../../shared/sampleRecoveryPlan.json';
import sampleDischargeNote from '../../../shared/sampleDischargeNote.txt?raw';
import AgentProgress from './components/AgentProgress.jsx';
import RecoveryDashboard from './components/RecoveryDashboard.jsx';
import RecoveryChat from './components/RecoveryChat.jsx';

const DISCLAIMER =
  'CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.';
const DEMO_USER = {
  username: 'admin',
  email: 'admin@careflow.local',
  password: 'admin'
};

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [plan, setPlan] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dischargeText, setDischargeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  async function requestRecoveryPlan(payload, options = {}) {
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/recovery-plan', {
        method: 'POST',
        body: payload
      });
      const data = await response.json();

      if (response.ok) {
        setPlan(data.plan);
      } else {
        setPlan(null);
        setErrorMessage(data.message || 'We could not generate a recovery plan. Paste the discharge text or use the sample note for the demo.');
      }
    } catch {
      if (options.useSampleFallback) {
        setPlan(sampleRecoveryPlan);
      } else {
        setPlan(null);
        setErrorMessage('We could not reach the recovery service. Paste the discharge text or use the sample note for the demo.');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function buildFormPayload() {
    const formData = new FormData();

    if (dischargeText.trim()) {
      formData.set('text', dischargeText.trim());
    }

    if (selectedFile) {
      formData.set('file', selectedFile);
    }

    return formData;
  }

  function loadSamplePlan() {
    setDischargeText(sampleDischargeNote.trim());
    const formData = new FormData();
    formData.set('text', sampleDischargeNote.trim());
    formData.set('useSample', 'true');
    void requestRecoveryPlan(formData, { useSampleFallback: true });
  }

  function generateRecoveryPlan() {
    void requestRecoveryPlan(buildFormPayload());
  }

  function handleLogin(event) {
    event.preventDefault();

    const normalizedIdentifier = loginIdentifier.trim().toLowerCase();
    const isDemoIdentifier =
      normalizedIdentifier === DEMO_USER.username ||
      normalizedIdentifier === DEMO_USER.email;

    if (isDemoIdentifier && loginPassword === DEMO_USER.password) {
      setLoginError('');
      setIsSignedIn(true);
      return;
    }

    setLoginError('Use admin or admin@careflow.local with password admin for the demo.');
  }

  if (!isSignedIn) {
    return (
      <main key="login" className="login-shell">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-copy">
            <p className="eyebrow">Patient recovery dashboard</p>
            <h1 id="login-title">Welcome to CAREFLOW</h1>
            <p>
              Sign in to organize discharge instructions, recovery tasks, medications,
              warning signs, and questions for your care team.
            </p>
          </div>

          <form
            className="login-form"
            aria-label="Patient login"
            onSubmit={handleLogin}
          >
            <label htmlFor="login-identifier">Username or email</label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter username or email"
              value={loginIdentifier || ''}
              onChange={(event) => setLoginIdentifier(event.target.value)}
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={loginPassword || ''}
              onChange={(event) => setLoginPassword(event.target.value)}
            />

            {loginError ? (
              <p className="login-error" role="alert">
                {loginError}
              </p>
            ) : null}

            <button type="submit" className="primary-button">
              Sign in to CAREFLOW
            </button>
          </form>

          <aside className="login-disclaimer" aria-label="Medical disclaimer">
            <p>{DISCLAIMER}</p>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main key="app" className="app-shell">
      <section className="input-panel" aria-labelledby="app-title">
        <div className="brand-row">
          <p className="eyebrow">Patient recovery dashboard</p>
          <h1 id="app-title">CAREFLOW</h1>
          <p className="intro">Turn discharge instructions into a practical recovery plan.</p>
        </div>

        <form className="input-form" aria-label="Discharge note input">
          <label htmlFor="pdf-upload">Upload discharge PDF</label>
          <input
            id="pdf-upload"
            name="file"
            type="file"
            accept="application/pdf"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />

          <label htmlFor="discharge-text">Paste discharge text</label>
          <textarea
            id="discharge-text"
            name="text"
            rows={10}
            placeholder="Paste discharge instructions here"
            value={dischargeText}
            onChange={(event) => setDischargeText(event.target.value)}
          />

          <div className="action-row">
            <button type="button" className="secondary-button" onClick={loadSamplePlan}>
              Load sample pneumonia note
            </button>
            <button type="button" className="primary-button" onClick={generateRecoveryPlan}>
              Generate recovery plan
            </button>
          </div>
        </form>
      </section>

      <section className="workspace" aria-label="Recovery workspace">
        {errorMessage ? (
          <section className="notice notice-error" role="alert" aria-label="Recovery plan error">
            <p>{errorMessage}</p>
          </section>
        ) : null}

        {isGenerating ? <AgentProgress stages={agentProgress} /> : null}

        {plan ? (
          <>
            <RecoveryDashboard plan={plan} />
            <section className="chat-section" aria-labelledby="recovery-chat-heading">
              <h2 id="recovery-chat-heading">Recovery Chat</h2>
              <RecoveryChat plan={plan} />
            </section>
          </>
        ) : (
          <section className="empty-dashboard" aria-label="Empty recovery dashboard">
            <h2>Recovery plan will appear here</h2>
            <p>Upload a discharge PDF, paste instructions, or load the pneumonia sample to begin.</p>
          </section>
        )}
      </section>

      <aside className="global-disclaimer" aria-label="Medical disclaimer">
        <p>{DISCLAIMER}</p>
      </aside>
    </main>
  );
}
