import { buildRecoveryPlan, RecoveryPlanGenerationError } from "../services/recoveryPlanService.js";
import { extractPdfText, PdfTextExtractionError } from "../services/pdfTextExtractor.js";

async function readBodyBuffer(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function getContentType(request) {
  return request.headers["content-type"] || "";
}

function parseJsonBody(buffer) {
  const rawBody = buffer.toString("utf8");

  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody);
}

function parseMultipartBody(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);

  if (!boundaryMatch) {
    return {};
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const rawBody = buffer.toString("latin1");
  const parts = rawBody.split(`--${boundary}`);
  const fields = {};

  for (const part of parts) {
    const trimmedPart = part.replace(/^\r?\n/, "");

    if (!trimmedPart || trimmedPart === "--\r\n" || trimmedPart === "--") {
      continue;
    }

    const headerEnd = trimmedPart.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      continue;
    }

    const rawHeaders = trimmedPart.slice(0, headerEnd);
    let rawValue = trimmedPart.slice(headerEnd + 4);
    rawValue = rawValue.replace(/\r?\n--$/, "").replace(/\r?\n$/, "");

    const disposition = rawHeaders.match(/content-disposition:[^\r\n]+/i)?.[0] || "";
    const name = disposition.match(/name="([^"]+)"/)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/)?.[1];

    if (!name) {
      continue;
    }

    if (filename !== undefined) {
      fields[name] = {
        filename,
        buffer: Buffer.from(rawValue, "latin1")
      };
    } else {
      fields[name] = Buffer.from(rawValue, "latin1").toString("utf8");
    }
  }

  return fields;
}

async function readRouteInput(request) {
  const bodyBuffer = await readBodyBuffer(request);
  const contentType = getContentType(request);

  if (contentType.includes("multipart/form-data")) {
    const fields = parseMultipartBody(bodyBuffer, contentType);

    if (fields.file?.buffer) {
      return {
        text: await extractPdfText(fields.file.buffer),
        useSample: fields.useSample === "true"
      };
    }

    return {
      text: typeof fields.text === "string" ? fields.text : "",
      useSample: fields.useSample === "true"
    };
  }

  const body = parseJsonBody(bodyBuffer);

  return {
    text: body.text,
    useSample: body.useSample === true
  };
}

export async function handleRecoveryPlanRoute(request) {
  try {
    const input = await readRouteInput(request);

    return await buildRecoveryPlan(input);
  } catch (error) {
    if (error instanceof PdfTextExtractionError) {
      return {
        statusCode: 400,
        body: {
          error: error.code,
          message: error.message
        }
      };
    }

    if (error instanceof RecoveryPlanGenerationError) {
      return {
        statusCode: error.code === "RECOVERY_TEXT_REQUIRED" ? 400 : 502,
        body: {
          error: error.code,
          message: error.message
        }
      };
    }

    throw error;
  }
}
