export class PdfTextExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PdfTextExtractionError";
    this.code = "PDF_TEXT_EXTRACTION_FAILED";
  }
}

const pdfFallbackMessage =
  "We could not read this PDF reliably. Paste the discharge text or upload a PDF.";

function looksLikePdf(buffer) {
  return buffer.subarray(0, 8).toString("utf8").startsWith("%PDF");
}

function normalizeText(text) {
  return text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function decodePdfLiteralString(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped) => {
      const escapes = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "(": "(",
        ")": ")",
        "\\": "\\"
      };

      return escapes[escaped] || escaped;
    })
    .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function extractLiteralStrings(pdfText) {
  const values = [];
  let index = 0;

  while (index < pdfText.length) {
    if (pdfText[index] !== "(") {
      index += 1;
      continue;
    }

    let depth = 1;
    let value = "";
    index += 1;

    while (index < pdfText.length && depth > 0) {
      const character = pdfText[index];
      const previous = pdfText[index - 1];

      if (character === "(" && previous !== "\\") {
        depth += 1;
        value += character;
      } else if (character === ")" && previous !== "\\") {
        depth -= 1;
        if (depth > 0) {
          value += character;
        }
      } else {
        value += character;
      }

      index += 1;
    }

    if (value.trim()) {
      values.push(decodePdfLiteralString(value));
    }
  }

  return values;
}

function extractTextBasedPdf(buffer) {
  const pdfText = buffer.toString("latin1");
  const text = normalizeText(extractLiteralStrings(pdfText).join(" "));

  if (!text || text.length < 12) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  return text;
}

export async function extractPdfText(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  if (looksLikePdf(buffer)) {
    return extractTextBasedPdf(buffer);
  }

  const text = normalizeText(buffer.toString("utf8"));

  if (!text) {
    throw new PdfTextExtractionError(pdfFallbackMessage);
  }

  return text;
}
