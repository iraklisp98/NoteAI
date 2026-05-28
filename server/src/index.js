import http from "node:http";

import { handleChatRoute } from "./routes/chatRoute.js";
import { handleRecoveryPlanRoute } from "./routes/recoveryPlanRoute.js";
import { loadEnvFile } from "./services/envLoader.js";

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(JSON.stringify(body));
}

export function createServer() {
  return http.createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
      }

      if (request.method === "POST" && request.url === "/api/recovery-plan") {
        const result = await handleRecoveryPlanRoute(request);
        if (result && typeof result.statusCode === "number" && "body" in result) {
          sendJson(response, result.statusCode, result.body);
        } else {
          sendJson(response, 200, result);
        }
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat") {
        sendJson(response, 200, await handleChatRoute(request));
        return;
      }

      sendJson(response, 404, {
        error: "NOT_FOUND",
        message: "Route not found."
      });
    } catch (error) {
      sendJson(response, 500, {
        error: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unexpected server error."
      });
    }
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await loadEnvFile();
  const port = Number.parseInt(process.env.SERVER_PORT || "3001", 10);

  createServer().listen(port, () => {
    console.log(`CAREFLOW backend listening on http://localhost:${port}`);
  });
}
