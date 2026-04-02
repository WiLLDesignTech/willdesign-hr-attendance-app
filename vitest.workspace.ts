import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/types",
  "packages/core",
  "packages/data",
  "packages/api",
  "packages/slack",
]);
