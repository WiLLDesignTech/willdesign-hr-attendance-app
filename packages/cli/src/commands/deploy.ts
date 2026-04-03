import { Command } from "commander";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import chalk from "chalk";
import { parseAppConfig } from "@hr-attendance-app/types";

export const deployCommand = new Command("deploy")
  .description("Deploy the application to AWS using CDK")
  .option("--stage <stage>", "Deployment stage", "dev")
  .option("--dry-run", "Run CDK diff instead of deploy")
  .action(async (options: { stage: string; dryRun?: boolean }) => {
    console.log(chalk.bold("\n  Deploying HR Attendance App\n"));

    // 1. Validate config
    const configPath = resolve(process.cwd(), "config.yaml");
    if (!existsSync(configPath)) {
      console.error(chalk.red("  config.yaml not found. Run 'hr-app init' first."));
      process.exit(1);
    }

    const raw = parseYaml(readFileSync(configPath, "utf-8")) as unknown;
    try {
      parseAppConfig(raw);
      console.log(chalk.green("  config.yaml validated"));
    } catch (err) {
      console.error(chalk.red("  Invalid config.yaml:"), err);
      process.exit(1);
    }

    // 2. Check AWS credentials
    try {
      execSync("aws sts get-caller-identity", { stdio: "pipe" });
      console.log(chalk.green("  AWS credentials valid"));
    } catch {
      console.error(chalk.red("  AWS credentials not configured. Run 'aws configure' or set AWS_PROFILE."));
      process.exit(1);
    }

    // 3. Build
    console.log(chalk.dim("  Building packages..."));
    execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });

    // 4. Deploy
    const cdkCommand = options.dryRun ? "diff" : "deploy --all --require-approval never";
    console.log(chalk.dim(`  Running CDK ${options.dryRun ? "diff" : "deploy"}...`));
    execSync(`npx cdk ${cdkCommand} --context stage=${options.stage}`, {
      stdio: "inherit",
      cwd: resolve(process.cwd(), "infra"),
    });

    if (!options.dryRun) {
      console.log(chalk.green("\n  Deployment complete!"));
      console.log(chalk.dim("  Run 'hr-app status' to check stack health.\n"));
    }
  });
