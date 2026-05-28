import { spawn } from "node:child_process";

const backendPort = process.env.SERVER_PORT || "3001";

const processes = [
  spawn("node", ["server/src/index.js"], {
    cwd: process.cwd(),
    env: { ...process.env, SERVER_PORT: backendPort },
    stdio: "inherit",
  }),
  spawn("npm", ["--prefix", "apps/patient", "run", "dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SERVER_PORT: backendPort,
      VITE_API_TARGET: process.env.VITE_API_TARGET || `http://localhost:${backendPort}`,
    },
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(exitCode);
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      stopAll(code || 1);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
