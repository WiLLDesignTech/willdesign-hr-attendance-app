// @hr-attendance-app/api — REST API Lambda handlers (composition root)

export { parseAuthContext, validateBody, handleError, buildResponse, withAuth } from "./middleware/index.js";
export type { ApiResponse, AuthenticatedParams } from "./middleware/index.js";
export { createRouter } from "./handlers/router.js";
export type { RouteHandler, RouteDefinition } from "./handlers/router.js";
export { createDeps, getTenantDeps } from "./composition.js";
export type { AppDeps, AppServices, DepsResolver } from "./composition.js";
export { buildRoutes } from "./routes.js";
export { handler } from "./lambda.js";
