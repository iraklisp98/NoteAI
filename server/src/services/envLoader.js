import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultEnvPath = path.resolve(__dirname, "../../..", ".env");

function parseEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export async function loadEnvFile(filePath = defaultEnvPath) {
  let content;

  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);

    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }

  return true;
}
