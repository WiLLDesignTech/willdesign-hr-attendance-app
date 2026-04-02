import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import type { EnvironmentConfig } from "./config";

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool (Lite tier) — implemented in Task 12
    void config;
  }
}
