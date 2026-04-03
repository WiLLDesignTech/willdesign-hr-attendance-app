import { Command } from "commander";
import inquirer from "inquirer";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stringify as toYaml } from "yaml";
import chalk from "chalk";
import { parseAppConfig } from "@hr-attendance-app/types";

interface InitAnswers {
  appName: string;
  appShortName: string;
  themeColor: string;
  deploymentMode: "single" | "multi";
  awsRegion: string;
  accountingCurrency: string;
  domain: string;
  regions: string[];
  adminEmail: string;
}

const REGION_TEMPLATES = [
  { name: "Japan (JP)", value: "JP", timezone: "Asia/Tokyo", currency: "JPY" },
  { name: "Nepal (NP)", value: "NP", timezone: "Asia/Kathmandu", currency: "NPR" },
  { name: "United States (US)", value: "US", timezone: "America/New_York", currency: "USD" },
  { name: "India (IN)", value: "IN", timezone: "Asia/Kolkata", currency: "INR" },
  { name: "United Kingdom (GB)", value: "GB", timezone: "Europe/London", currency: "GBP" },
  { name: "Germany (DE)", value: "DE", timezone: "Europe/Berlin", currency: "EUR" },
];

const AWS_REGIONS = [
  { name: "Asia Pacific - Tokyo (ap-northeast-1)", value: "ap-northeast-1" },
  { name: "Asia Pacific - Singapore (ap-southeast-1)", value: "ap-southeast-1" },
  { name: "Asia Pacific - Mumbai (ap-south-1)", value: "ap-south-1" },
  { name: "US East - Virginia (us-east-1)", value: "us-east-1" },
  { name: "US West - Oregon (us-west-2)", value: "us-west-2" },
  { name: "Europe - Ireland (eu-west-1)", value: "eu-west-1" },
  { name: "Europe - Frankfurt (eu-central-1)", value: "eu-central-1" },
];

export const initCommand = new Command("init")
  .description("Initialize a new HR Attendance App project with interactive setup")
  .action(async () => {
    console.log(chalk.bold("\n  HR Attendance App — Setup Wizard\n"));

    const answers = await inquirer.prompt<InitAnswers>([
      {
        type: "input",
        name: "appName",
        message: "Company/App name:",
        default: "HR Attendance App",
      },
      {
        type: "input",
        name: "appShortName",
        message: "Short name (for mobile/PWA):",
        default: "HR App",
      },
      {
        type: "input",
        name: "themeColor",
        message: "Brand color (hex):",
        default: "#58C2D9",
        validate: (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v) || "Must be a valid hex color (e.g. #58C2D9)",
      },
      {
        type: "list",
        name: "deploymentMode",
        message: "Deployment mode:",
        choices: [
          { name: "Single-tenant (one company)", value: "single" },
          { name: "Multi-tenant (multiple companies)", value: "multi" },
        ],
      },
      {
        type: "list",
        name: "awsRegion",
        message: "AWS region for deployment:",
        choices: AWS_REGIONS,
        default: "ap-northeast-1",
      },
      {
        type: "input",
        name: "accountingCurrency",
        message: "Accounting/home currency (ISO 4217):",
        default: "JPY",
        validate: (v: string) => /^[A-Z]{3}$/.test(v) || "Must be a 3-letter currency code (e.g. JPY, USD)",
      },
      {
        type: "input",
        name: "domain",
        message: "Custom domain (leave empty to skip):",
        default: "",
      },
      {
        type: "checkbox",
        name: "regions",
        message: "Select office regions:",
        choices: REGION_TEMPLATES.map((r) => ({ name: r.name, value: r.value, checked: r.value === "JP" || r.value === "NP" })),
        validate: (v: string[]) => v.length > 0 || "Select at least one region",
      },
      {
        type: "input",
        name: "adminEmail",
        message: "Admin email (for first super-admin account):",
        validate: (v: string) => v.includes("@") || "Enter a valid email",
      },
    ]);

    const selectedRegions = answers.regions.map((code) => {
      const tmpl = REGION_TEMPLATES.find((r) => r.value === code);
      return tmpl
        ? { name: tmpl.name.split(" (")[0]!, code: tmpl.value, timezone: tmpl.timezone, currency: tmpl.currency }
        : { name: code, code, timezone: "UTC", currency: "USD" };
    });

    const configData: Record<string, unknown> = {
      app: {
        appName: answers.appName,
        appShortName: answers.appShortName,
        themeColor: answers.themeColor,
      },
      deployment: {
        mode: answers.deploymentMode,
        awsRegion: answers.awsRegion,
        accountingCurrency: answers.accountingCurrency,
        stage: "dev",
        ...(answers.domain ? { domain: answers.domain } : {}),
      },
      slack: {},
      regions: selectedRegions,
    };

    // Validate through Zod
    const validated = parseAppConfig(configData);

    const configPath = resolve(process.cwd(), "config.yaml");
    writeFileSync(configPath, toYaml(configData), "utf-8");

    console.log(chalk.green(`\n  config.yaml written to ${configPath}`));
    console.log(chalk.dim(`  Admin email: ${answers.adminEmail} (use during first deploy)`));
    console.log();
    console.log(chalk.bold("  Next steps:"));
    console.log(`    ${chalk.cyan("hr-app dev")}      Start local development stack`);
    console.log(`    ${chalk.cyan("hr-app deploy")}   Deploy to AWS`);
    console.log(`    ${chalk.cyan("hr-app status")}   Check deployment health`);
    console.log();

    // Suppress unused var warning — validated config ensures schema compliance
    void validated;
  });
