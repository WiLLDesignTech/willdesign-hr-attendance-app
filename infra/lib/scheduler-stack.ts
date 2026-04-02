import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import type { EnvironmentConfig } from "./config";

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // EventBridge cron rules — implemented in Task 10
    void config;
  }
}
