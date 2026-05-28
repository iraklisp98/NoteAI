import { useState } from 'react';
import agentProgress from '../../../shared/agentProgress.json';
import AgentProgress from './components/AgentProgress.jsx';
import RecoveryDashboard from './components/RecoveryDashboard.jsx';
import RecoveryChat from './components/RecoveryChat.jsx';

const DISCLAIMER =
  'CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.';

export default function App() {
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function requestRecoveryPlan(payload) {
    setIsGenerating(true);

    const response = await fetch('/api/recovery-plan', {
      method: 'POST',
      body: payload
    });
    const data = await response.json();

    if (response.ok) {
      setPlan(data.plan);
    }

    setIsGenerating(false);
  }

  function loadSamplePlan() {
    const formData = new FormData();
    formData.set('useSample', 'true');
    void requestRecoveryPlan(formData);
  }

  return (
    <main>
      <section aria-labelledby="app-title">
        <p>Patient recovery dashboard</p>
        <h1 id="app-title">CAREFLOW</h1>
        <p>Turn discharge instructions into a practical recovery plan.</p>

        <form aria-label="Discharge note input">
          <label htmlFor="pdf-upload">Upload discharge PDF</label>
          <input id="pdf-upload" name="file" type="file" accept="application/pdf" />

          <label htmlFor="discharge-text">Paste discharge text</label>
          <textarea
            id="discharge-text"
            name="text"
            rows={10}
            placeholder="Paste discharge instructions here"
          />

          <button type="button" onClick={loadSamplePlan}>
            Load sample pneumonia note
          </button>
          <button type="button">Generate recovery plan</button>
        </form>
      </section>

      {isGenerating ? <AgentProgress stages={agentProgress} /> : null}

      {plan ? (
        <>
          <RecoveryDashboard plan={plan} />
          <section aria-labelledby="recovery-chat-heading">
            <h2 id="recovery-chat-heading">Recovery Chat</h2>
            <RecoveryChat plan={plan} />
          </section>
        </>
      ) : null}

      <aside aria-label="Medical disclaimer">
        <p>{DISCLAIMER}</p>
      </aside>
    </main>
  );
}
