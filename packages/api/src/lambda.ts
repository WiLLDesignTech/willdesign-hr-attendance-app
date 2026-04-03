/**
 * Lambda entry point — creates router with all routes and DI deps.
 */
import { createRouter } from "./handlers/router.js";
import { createDeps } from "./composition.js";
import { buildRoutes } from "./routes.js";

const deps = createDeps();
const routes = buildRoutes(deps);

export const handler = createRouter(routes);
