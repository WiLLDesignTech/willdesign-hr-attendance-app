import { Command } from "commander";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";

export const destroyCommand = new Command("destroy")
  .description("Destroy all AWS stacks (removes all cloud resources)")
  .option("--stage <stage>", "Deployment stage", "dev")
  .option("--force", "Skip confirmation prompt")
  .action(async (options: { stage: string; force?: boolean }) => {
    console.log(chalk.bold("\n  Destroy HR Attendance App Stacks\n"));

    if (!options.force) {
      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: chalk.red(`This will destroy ALL ${options.stage} stacks. Are you sure?`),
          default: false,
        },
      ]);
      if (!confirm) {
        console.log(chalk.dim("  Aborted."));
        return;
      }
    }

    console.log(chalk.dim("  Running CDK destroy..."));
    execSync(`npx cdk destroy --all --force --context stage=${options.stage}`, {
      stdio: "inherit",
      cwd: resolve(process.cwd(), "infra"),
    });

    console.log(chalk.green("\n  All stacks destroyed.\n"));
  });
