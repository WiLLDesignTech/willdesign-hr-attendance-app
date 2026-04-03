import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let cachedClient: DynamoDBDocumentClient | null = null;

/**
 * Get or create a DynamoDBDocumentClient.
 * Cached per Lambda invocation (module-level singleton).
 * Supports local DynamoDB via DYNAMODB_ENDPOINT env var.
 */
export function getDocClient(tableName?: string): { client: DynamoDBDocumentClient; tableName: string } {
  const table = tableName ?? process.env["DYNAMODB_TABLE_NAME"] ?? "willdesign-hr-table";

  if (!cachedClient) {
    const endpoint = process.env["DYNAMODB_ENDPOINT"];
    const rawClient = new DynamoDBClient({
      region: process.env["AWS_REGION"] ?? "ap-northeast-1",
      ...(endpoint
        ? { endpoint, credentials: { accessKeyId: "local", secretAccessKey: "local" } }
        : {}),
    });
    cachedClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  return { client: cachedClient, tableName: table };
}

/**
 * Reset cached client (for testing).
 */
export function resetClient(): void {
  cachedClient = null;
}
