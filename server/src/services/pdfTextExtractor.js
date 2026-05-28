export class PdfTextExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PdfTextExtractionError";
    this.code = "PDF_TEXT_EXTRACTION_FAILED";
  }
}

const pdfFallbackMessage =
  "We could not read this PDF reliably. Paste the discharge text or use the sample note for the demo.";

function looksLikePdf(buffer) {
  return buffer.subarray(0, 8).toString("utf8").startsWith("%PDF");
}

function normalizeText(text) {
  return text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

export async function extractPdfText(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  if (looksLikePdf(buffer)) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  const text = normalizeText(buffer.toString("utf8"));

  if (!text) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  return text;
}
