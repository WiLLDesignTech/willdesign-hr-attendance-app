import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import type { RawPolicy } from "@hr-attendance-app/types";
import type { PolicyRepository } from "@hr-attendance-app/core";

const S3_KEYS = {
  COMPANY: "policies/org.json",
  GROUP: (name: string) => `policies/groups/${name}.json`,
  USER: (id: string) => `policies/users/${id}.json`,
} as const;

export class S3PolicyRepository implements PolicyRepository {
  private readonly cache = new Map<string, RawPolicy>();

  constructor(
    private readonly s3: S3Client,
    private readonly bucketName: string,
  ) {}

  async getCompanyPolicy(): Promise<RawPolicy> {
    return this.getWithCache(S3_KEYS.COMPANY);
  }

  async getGroupPolicy(groupName: string): Promise<RawPolicy | null> {
    return this.getWithCache(S3_KEYS.GROUP(groupName)).catch(() => null);
  }

  async getUserPolicy(userId: string): Promise<RawPolicy | null> {
    return this.getWithCache(S3_KEYS.USER(userId)).catch(() => null);
  }

  async saveGroupPolicy(groupName: string, policy: RawPolicy): Promise<void> {
    const key = S3_KEYS.GROUP(groupName);
    await this.putJson(key, policy);
    this.cache.delete(key);
  }

  async saveUserPolicy(userId: string, policy: RawPolicy): Promise<void> {
    const key = S3_KEYS.USER(userId);
    await this.putJson(key, policy);
    this.cache.delete(key);
  }

  private async getWithCache(key: string): Promise<RawPolicy> {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const result = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    }));
    const body = await result.Body?.transformToString();
    if (!body) throw new Error(`Empty policy at ${key}`);

    const policy = JSON.parse(body) as RawPolicy;
    this.cache.set(key, policy);
    return policy;
  }

  private async putJson(key: string, data: RawPolicy): Promise<void> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }));
  }
}
