export default function AgentProgress({ stages }) {
  if (!stages?.length) {
    return null;
  }

  return (
    <section aria-label="Agent progress">
      <h2>Agent Progress</h2>
      <ol>
        {stages.map((stage) => (
          <li key={stage.name}>
            <h3>{stage.name}</h3>
            <p>{stage.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
