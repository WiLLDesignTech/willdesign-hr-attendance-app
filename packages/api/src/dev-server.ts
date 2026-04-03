/**
 * Local development server — Express wrapper around Lambda handler.
 * Run: npx tsx watch src/dev-server.ts
 *
 * This file is executed directly by tsx (not compiled by tsc),
 * so it uses Node-only APIs that won't appear in the build output.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createRouter } from "./handlers/router.js";
import { getTenantDeps } from "./composition.js";
import { buildRoutes } from "./routes.js";
import { devAuthRoutes, parseDevToken } from "./dev-auth.js";

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../../.env.local");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
} catch {
  // .env.local not found — use existing env vars
}

const PORT = Number(process.env["API_PORT"] ?? 3001);

const routes = [...buildRoutes(getTenantDeps), ...devAuthRoutes(getTenantDeps)];
const lambdaHandler = createRouter(routes);

const app = express();
app.use(express.json());

// Convert Express req/res → Lambda event → Lambda response
app.all("/api/*splat", async (req, res) => {
  try {
    const claims = parseDevToken(req.headers.authorization);

    const event = {
      httpMethod: req.method,
      path: req.path,
      pathParameters: null as Record<string, string> | null,
      queryStringParameters: req.query as Record<string, string>,
      body: req.method !== "GET" ? JSON.stringify(req.body) : null,
      requestContext: { authorizer: { claims } },
    };

    const result = await lambdaHandler(event);
    const headers = result.headers ?? {};
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
    res.status(result.statusCode).send(result.body);
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`);
  console.log(`DynamoDB endpoint: ${process.env["DYNAMODB_ENDPOINT"] ?? "not set"}`);
});
