import type { RawPolicy } from "@hr-attendance-app/types";

export interface PolicyRepository {
  getCompanyPolicy(): Promise<RawPolicy>;
  getGroupPolicy(groupName: string): Promise<RawPolicy | null>;
  getUserPolicy(userId: string): Promise<RawPolicy | null>;
  saveGroupPolicy(groupName: string, policy: RawPolicy): Promise<void>;
  saveUserPolicy(userId: string, policy: RawPolicy): Promise<void>;
}
