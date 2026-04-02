import { defineWorkspace } from "vitest/config";

export default defineWorkspace(
  ["types", "core", "data", "api", "slack"].map((pkg) => ({
    test: {
      name: pkg,
      root: `./packages/${pkg}`,
      globals: true,
      environment: "node",
    },
  })),
);
