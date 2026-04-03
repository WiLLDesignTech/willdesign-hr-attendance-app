import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { BaseStack } from "./base-stack";
import type { EnvironmentConfig } from "./config";

interface SchedulerStackProps extends cdk.StackProps {
  readonly tableArn: string;
  readonly tableName: string;
}

export class SchedulerStack extends BaseStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: SchedulerStackProps) {
    super(scope, id, config);

    const cronRole = new iam.Role(this, "CronRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    });

    cronRole.addToPolicy(new iam.PolicyStatement({
      actions: ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"],
      resources: [props.tableArn, `${props.tableArn}/index/*`],
    }));

    cronRole.addToPolicy(new iam.PolicyStatement({
      actions: ["ses:SendEmail"],
      resources: ["*"],
    }));

    const lambdaEnv = {
      TABLE_NAME: props.tableName,
      STAGE: config.stage,
    };

    const dailyCron = new lambda.Function(this, "DailyCron", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/cron-daily"),
      role: cronRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: lambdaEnv,
    });

    const weeklyCron = new lambda.Function(this, "WeeklyCron", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/cron-weekly"),
      role: cronRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: lambdaEnv,
    });

    const monthlyCron = new lambda.Function(this, "MonthlyCron", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/cron-monthly"),
      role: cronRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 512,
      environment: lambdaEnv,
    });

    const reminderCron = new lambda.Function(this, "ReminderCron", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/cron-reminder"),
      role: cronRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: lambdaEnv,
    });

    // Daily at 23:55 JST (14:55 UTC)
    new events.Rule(this, "DailyRule", {
      schedule: events.Schedule.cron({ minute: "55", hour: "14" }),
      targets: [new targets.LambdaFunction(dailyCron)],
    });

    // Weekly Monday 00:15 JST (Sunday 15:15 UTC)
    new events.Rule(this, "WeeklyRule", {
      schedule: events.Schedule.cron({ minute: "15", hour: "15", weekDay: "SUN" }),
      targets: [new targets.LambdaFunction(weeklyCron)],
    });

    // Monthly 1st 00:30 JST = 1st 15:30 UTC (previous day)
    new events.Rule(this, "MonthlyRule", {
      schedule: events.Schedule.cron({ minute: "30", hour: "15", day: "1" }),
      targets: [new targets.LambdaFunction(monthlyCron)],
    });

    // Every 4 hours for reminders
    new events.Rule(this, "ReminderRule", {
      schedule: events.Schedule.rate(cdk.Duration.hours(4)),
      targets: [new targets.LambdaFunction(reminderCron)],
    });
  }
}
