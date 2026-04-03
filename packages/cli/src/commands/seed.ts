import { Command } from "commander";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import chalk from "chalk";

export const seedCommand = new Command("seed")
  .description("Load sample data into the database")
  .option("--endpoint <url>", "DynamoDB endpoint", "http://localhost:8000")
  .action((options: { endpoint: string }) => {
    console.log(chalk.bold("\n  Seeding database...\n"));

    const seedScript = resolve(process.cwd(), "scripts/seed-data.ts");
    try {
      execSync(`npx tsx ${seedScript}`, {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, DYNAMODB_ENDPOINT: options.endpoint },
      });
      console.log(chalk.green("\n  Seed data loaded successfully.\n"));
    } catch (err) {
      console.error(chalk.red("  Seeding failed:"), err);
      process.exit(1);
    }
  });
