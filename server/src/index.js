import http from "node:http";

import { handleRecoveryPlanRoute } from "./routes/recoveryPlanRoute.js";

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
  const port = Number.parseInt(process.env.SERVER_PORT || "3001", 10);

  createServer().listen(port, () => {
    console.log(`CAREFLOW backend listening on http://localhost:${port}`);
  });
}
