import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("root dev script starts backend and patient app together", () => {
  const rootPackage = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const devScript = rootPackage.scripts?.dev || "";
  const devRunner = readFileSync(new URL("../../scripts/dev.mjs", import.meta.url), "utf8");

  assert.match(devScript, /node scripts\/dev\.mjs/);
  assert.match(devRunner, /server\/src\/index\.js/);
  assert.match(devRunner, /apps\/patient/);
});

test("patient Vite dev server proxies API calls to the backend", () => {
  const viteConfig = readFileSync(new URL("../../apps/patient/vite.config.js", import.meta.url), "utf8");

  assert.match(viteConfig, /\/api/);
  assert.match(viteConfig, /localhost:3001/);
});
