#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { destroyCommand } from "./commands/destroy.js";
import { statusCommand } from "./commands/status.js";
import { devCommand } from "./commands/dev.js";
import { seedCommand } from "./commands/seed.js";

const program = new Command();

program
  .name("hr-app")
  .description("HR Attendance App CLI — setup, deploy, and manage")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(destroyCommand);
program.addCommand(statusCommand);
program.addCommand(devCommand);
program.addCommand(seedCommand);

program.parse();
