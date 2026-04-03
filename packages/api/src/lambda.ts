/**
 * Lambda entry point — creates router with all routes and DI deps.
 */
import { createRouter } from "./handlers/router.js";
import { getTenantDeps } from "./composition.js";
import { buildRoutes } from "./routes.js";

const routes = buildRoutes(getTenantDeps);

export const handler = createRouter(routes);
