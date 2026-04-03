import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "types",
          root: "./packages/types",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "core",
          root: "./packages/core",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "data",
          root: "./packages/data",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "api",
          root: "./packages/api",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "slack",
          root: "./packages/slack",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "web",
          root: "./packages/web",
          globals: true,
          environment: "jsdom",
          setupFiles: ["src/test/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
