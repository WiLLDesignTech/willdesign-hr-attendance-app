/**
 * Orchestrates local DynamoDB setup: create table + seed data.
 * Run: npx tsx scripts/setup-local.ts
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function run(script: string): void {
  execSync(`npx tsx ${resolve(__dirname, script)}`, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DYNAMODB_ENDPOINT: process.env["DYNAMODB_ENDPOINT"] ?? "http://localhost:8000",
      DYNAMODB_TABLE_NAME: process.env["DYNAMODB_TABLE_NAME"] ?? "willdesign-hr-dev-table",
      AWS_REGION: process.env["AWS_REGION"] ?? "ap-northeast-1",
    },
  });
}

console.log("=== Setting up local DynamoDB ===");
run("create-table.ts");
run("seed-data.ts");
console.log("=== Local setup complete ===");
