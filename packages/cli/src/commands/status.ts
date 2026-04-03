import { Command } from "commander";
import { execSync } from "node:child_process";
import chalk from "chalk";

export const statusCommand = new Command("status")
  .description("Check deployment health via CloudFormation stack status")
  .option("--stage <stage>", "Deployment stage", "dev")
  .action((options: { stage: string }) => {
    console.log(chalk.bold("\n  Stack Status\n"));

    const prefix = options.stage === "prod" ? "hr-attendance-app" : "hr-attendance-app-dev";
    const stacks = ["database", "auth", "api", "slack", "web", "scheduler", "email"];

    for (const stack of stacks) {
      const stackName = `${prefix}-${stack}`;
      try {
        const output = execSync(
          `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].StackStatus" --output text`,
          { stdio: "pipe", encoding: "utf-8" },
        ).trim();

        const color = output.includes("COMPLETE") ? chalk.green : output.includes("PROGRESS") ? chalk.yellow : chalk.red;
        console.log(`  ${color("●")} ${stackName}: ${color(output)}`);
      } catch {
        console.log(`  ${chalk.dim("○")} ${stackName}: ${chalk.dim("NOT DEPLOYED")}`);
      }
    }
    console.log();
  });
