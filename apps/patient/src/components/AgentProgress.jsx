import React from 'react';
export default function AgentProgress({ stages }) {
  if (!stages?.length) {
    return null;
  }

  return (
    <section className="agent-progress" aria-label="Agent progress">
      <div className="section-heading">
        <p className="eyebrow">Orchestration</p>
        <h2>Agent Progress</h2>
      </div>
      <ol className="agent-list">
        {stages.map((stage, index) => (
          <li key={stage.name} className="agent-step">
            <span className="step-index">{index + 1}</span>
            <div>
              <h3>{stage.name}</h3>
              <p>{stage.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
