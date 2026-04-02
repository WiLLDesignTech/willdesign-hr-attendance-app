import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import type { EnvironmentConfig } from "./config";

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 + CloudFront static hosting — implemented in Task 15
    void config;
  }
}
