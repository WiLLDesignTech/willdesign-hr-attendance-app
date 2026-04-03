import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Document } from "@hr-attendance-app/types";
import { S3_PREFIXES } from "@hr-attendance-app/types";
import type { DocumentRepository } from "@hr-attendance-app/core";
import { KEYS } from "../dynamo/keys.js";

const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes

export class S3DocumentRepository implements DocumentRepository {
  constructor(
    private readonly s3: S3Client,
    private readonly docClient: DynamoDBDocumentClient,
    private readonly bucketName: string,
    private readonly tableName: string,
  ) {}

  async save(metadata: Document): Promise<Document> {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(metadata.employeeId),
        SK: KEYS.DOC(metadata.id),
        ...metadata,
      },
    }));
    return metadata;
  }

  async findByEmployee(employeeId: string): Promise<readonly Document[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": KEYS.EMP(employeeId),
        ":prefix": KEYS.DOC_PREFIX,
      },
    }));
    return (result.Items as Document[]) ?? [];
  }

  async getUploadUrl(employeeId: string, fileName: string): Promise<string> {
    const s3Key = S3_PREFIXES.DOCUMENTS(employeeId, fileName);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: "application/octet-stream",
    });
    return getSignedUrl(this.s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  }

  async getDownloadUrl(employeeId: string, documentId: string): Promise<string> {
    const s3Key = S3_PREFIXES.DOCUMENTS(employeeId, documentId);
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  }
}
