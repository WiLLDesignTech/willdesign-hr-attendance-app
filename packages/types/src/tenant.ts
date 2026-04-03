// ─── Multi-Tenancy ───

export type DeploymentMode = "single" | "multi";

export const DEFAULT_TENANT_ID = "default";

export interface TenantContext {
  readonly tenantId: string;
}
