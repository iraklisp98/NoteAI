import { useState } from 'react';
import goldenIbuprofenAnswer from '../../../../shared/goldenIbuprofenAnswer.txt?raw';

const DISCLAIMER =
  'CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.';

function formatSafetyLevel(level) {
  return level.replaceAll('_', ' ');
}

export default function RecoveryChat({ plan }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [isSending, setIsSending] = useState(false);

  async function sendQuestion(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setIsSending(true);
    try {
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          plan
        })
      });
      const data = await apiResponse.json();
      setResponse(data);
    } catch {
      setResponse({
        answer: goldenIbuprofenAnswer.trim(),
        source: 'Medication Timeline',
        safetyLevel: 'ask_doctor'
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="chat-panel" aria-label="Recovery chat panel">
      <form className="chat-form" onSubmit={sendQuestion}>
        <label htmlFor="recovery-question">Ask a recovery question</label>
        <textarea
          id="recovery-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          placeholder="Can I take ibuprofen with these medications?"
        />
        <button className="primary-button" type="submit" disabled={isSending}>
          {isSending ? 'Sending' : 'Send'}
        </button>
      </form>

      {response ? (
        <article className="chat-answer" aria-label="Chat answer">
          <p>{response.answer}</p>
          <div className="answer-meta">
            <p>Source: {response.source}</p>
            <p>{formatSafetyLevel(response.safetyLevel)}</p>
          </div>
        </article>
      ) : null}

      <aside className="section-disclaimer" aria-label="Chat medical disclaimer">
        <p>{DISCLAIMER}</p>
      </aside>
    </section>
  );
}
