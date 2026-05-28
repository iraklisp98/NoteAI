import React from 'react';

function formatUrgency(urgency) {
  return urgency.replaceAll('_', ' ');
}

function urgencyClass(urgency) {
  return `urgency-pill urgency-${urgency}`;
}

export default function RecoveryDashboard({ plan }) {
  if (!plan) {
    return null;
  }

  return (
    <section className="dashboard" aria-label="Recovery dashboard">
      <section className="dashboard-section snapshot-section" aria-labelledby="recovery-snapshot-heading">
        <p className="eyebrow">Recovery Snapshot</p>
        <h2 id="recovery-snapshot-heading">Recovery Snapshot</h2>
        <h3>{plan.summary.title}</h3>
        <p>{plan.summary.what_happened}</p>
        <p className="recovery-goal">{plan.summary.recovery_goal}</p>
      </section>

      <section className="dashboard-section" aria-labelledby="todays-plan-heading">
        <h2 id="todays-plan-heading">Today's Plan</h2>
        <ul className="task-list">
          {plan.today.map((item) => (
            <li key={`${item.task}-${item.source}`}>
              <h3>{item.task}</h3>
              <p>{item.why_it_matters}</p>
              <p className="source-label">{item.source}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section" aria-labelledby="medication-timeline-heading">
        <h2 id="medication-timeline-heading">Medication Timeline</h2>
        <ul className="medication-list">
          {plan.medications.map((medication) => (
            <li key={medication.name}>
              <h3>{medication.name}</h3>
              <dl>
                <dt>Dose</dt>
                <dd>{medication.dose}</dd>
                <dt>Timing</dt>
                <dd>{medication.timing}</dd>
                <dt>Purpose</dt>
                <dd>{medication.purpose}</dd>
                <dt>Instructions</dt>
                <dd>{medication.instructions}</dd>
                <dt>Caution</dt>
                <dd>{medication.caution}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section" aria-labelledby="red-flags-heading" role="region">
        <h2 id="red-flags-heading">Red Flags</h2>
        <ul className="red-flag-list">
          {plan.red_flags.map((flag) => (
            <li key={`${flag.symptom}-${flag.urgency}`}>
              <div>
                <h3>{flag.symptom}</h3>
                <p>{flag.action}</p>
              </div>
              <p className={urgencyClass(flag.urgency)}>{formatUrgency(flag.urgency)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section" aria-labelledby="follow-up-checklist-heading">
        <h2 id="follow-up-checklist-heading">Follow-Up Checklist</h2>
        <ul className="task-list">
          {plan.follow_ups.map((followUp) => (
            <li key={`${followUp.task}-${followUp.timeframe}`}>
              <h3>{followUp.task}</h3>
              <p className="source-label">{followUp.timeframe}</p>
              <p>{followUp.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section compact-section" aria-labelledby="questions-heading">
        <h2 id="questions-heading">Questions for the Clinician</h2>
        <ul>
          {plan.questions_for_clinician.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section compact-section" aria-labelledby="missing-information-heading">
        <h2 id="missing-information-heading">Missing Information</h2>
        <ul>
          {plan.missing_information.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <aside className="section-disclaimer" aria-label="Medical disclaimer">
        <p>{plan.disclaimer}</p>
      </aside>
    </section>
  );
}
