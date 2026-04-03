import type { LanguagePreference, Role } from "@hr-attendance-app/types";

export interface CreateAuthUserInput {
  readonly email: string;
  readonly employeeId: string;
  readonly role: Role;
  readonly preferredLanguage: LanguagePreference;
}

export interface AuthProviderAdapter {
  createUser(input: CreateAuthUserInput): Promise<{ authUserId: string }>;
  disableUser(authUserId: string): Promise<void>;
  deleteUser(authUserId: string): Promise<void>;
  setTemporaryPassword(authUserId: string, tempPassword: string): Promise<void>;
  updateAttributes(authUserId: string, attributes: Record<string, string>): Promise<void>;
}
