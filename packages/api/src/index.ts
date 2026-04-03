// @willdesign-hr/api — REST API Lambda handlers (composition root)

export { parseAuthContext, validateBody, handleError, buildResponse } from "./middleware/index.js";
export type { ApiResponse } from "./middleware/index.js";
export { createRouter } from "./handlers/router.js";
export type { RouteHandler, RouteDefinition } from "./handlers/router.js";
export { createDeps } from "./composition.js";
export type { AppDeps, AppServices } from "./composition.js";
export { buildRoutes } from "./routes.js";
export { handler } from "./lambda.js";
