import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { extractPdfText, PdfTextExtractionError } from "../src/services/pdfTextExtractor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

test("returns readable text from a plain text buffer fallback", async () => {
  const text = await extractPdfText(Buffer.from("Discharge diagnosis: pneumonia"));

  assert.equal(text, "Discharge diagnosis: pneumonia");
});

test("extracts readable text from a simple text-based PDF stream", async () => {
  const pdf = Buffer.from(
    "%PDF-1.7\n" +
      "1 0 obj <<>> stream\n" +
      "BT (Discharge diagnosis: pneumonia) Tj [(Follow-up in ) 20 (3-5 days)] TJ ET\n" +
      "endstream endobj"
  );

  const text = await extractPdfText(pdf);

  assert.match(text, /Discharge diagnosis: pneumonia/);
  assert.match(text, /Follow-up in 3-5 days/);
});

test("throws a fallback-friendly error when PDF text cannot be extracted", async () => {
  await assert.rejects(
    () => extractPdfText(Buffer.from("%PDF-1.7\n%binary scanned content")),
    (error) => {
      assert.ok(error instanceof PdfTextExtractionError);
      assert.equal(error.code, "PDF_TEXT_EXTRACTION_FAILED");
      assert.match(error.message, /Paste the discharge text/);
      return true;
    }
  );
});

test("extracts requested details from the male pneumonia sample PDF", async () => {
  const pdf = await readFile(path.join(repoRoot, "shared/sampleMalePneumoniaDischargeSummary.pdf"));
  const text = await extractPdfText(pdf);

  assert.match(text, /55-year-old male/i);
  assert.match(text, /community-acquired pneumonia/i);
  assert.match(text, /Discharge medications/i);
  assert.match(text, /Follow-up/i);
});
