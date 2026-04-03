/**
 * Creates the DynamoDB table for local development.
 * Run: npx tsx scripts/create-table.ts
 */
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

const ENDPOINT = process.env["DYNAMODB_ENDPOINT"] ?? "http://localhost:8000";
const TABLE_NAME = process.env["DYNAMODB_TABLE_NAME"] ?? "willdesign-hr-dev-table";
const REGION = process.env["AWS_REGION"] ?? "ap-northeast-1";

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

async function tableExists(): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    return true;
  } catch {
    return false;
  }
}

async function createTable(): Promise<void> {
  if (await tableExists()) {
    console.log(`Table "${TABLE_NAME}" already exists — skipping creation.`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
        { AttributeName: "GSI2PK", AttributeType: "S" },
        { AttributeName: "GSI2SK", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "GSI2",
          KeySchema: [
            { AttributeName: "GSI2PK", KeyType: "HASH" },
            { AttributeName: "GSI2SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log(`Table "${TABLE_NAME}" created successfully.`);
}

createTable().catch((err) => {
  console.error("Failed to create table:", err);
  process.exit(1);
});
