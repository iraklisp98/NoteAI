import React, { useState } from 'react';
import agentProgress from '../../../shared/agentProgress.json';
import sampleRecoveryPlan from '../../../shared/sampleRecoveryPlan.json';
import sampleDischargeNote from '../../../shared/sampleDischargeNote.txt?raw';
import AgentProgress from './components/AgentProgress.jsx';
import RecoveryDashboard from './components/RecoveryDashboard.jsx';
import RecoveryChat from './components/RecoveryChat.jsx';

const DISCLAIMER =
  'CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.';

export default function App() {
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

  return (
    <main className="app-shell">
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
