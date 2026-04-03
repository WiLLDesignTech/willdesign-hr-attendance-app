import { Command } from "commander";
import { execSync } from "node:child_process";
import chalk from "chalk";

export const devCommand = new Command("dev")
  .description("Start local development stack (DynamoDB + API + Web)")
  .action(() => {
    console.log(chalk.bold("\n  Starting local development stack...\n"));
    console.log(chalk.dim("  DynamoDB Local: http://localhost:8000"));
    console.log(chalk.dim("  API Server:     http://localhost:3001"));
    console.log(chalk.dim("  Web App:        http://localhost:5173"));
    console.log();

    try {
      execSync("npm run dev", { stdio: "inherit", cwd: process.cwd() });
    } catch {
      // User killed with Ctrl+C
    }
  });
