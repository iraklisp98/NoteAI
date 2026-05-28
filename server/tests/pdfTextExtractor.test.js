import assert from "node:assert/strict";
import test from "node:test";

import { extractPdfText, PdfTextExtractionError } from "../src/services/pdfTextExtractor.js";

test("returns readable text from a plain text buffer fallback", async () => {
  const text = await extractPdfText(Buffer.from("Discharge diagnosis: pneumonia"));

  assert.equal(text, "Discharge diagnosis: pneumonia");
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
