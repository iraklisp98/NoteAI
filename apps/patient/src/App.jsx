const DISCLAIMER =
  'CAREFLOW is a prototype that helps explain and organize discharge instructions. It is not a doctor and does not replace medical advice. For emergencies, call local emergency services. For medication changes or medical decisions, contact your doctor or pharmacist.';

export default function App() {
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

          <button type="button">Load sample pneumonia note</button>
          <button type="button">Generate recovery plan</button>
        </form>
      </section>

      <aside aria-label="Medical disclaimer">
        <p>{DISCLAIMER}</p>
      </aside>
    </main>
  );
}
