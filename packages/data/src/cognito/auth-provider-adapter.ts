import {
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import type { AuthProviderAdapter, CreateAuthUserInput } from "@hr-attendance-app/core";
import { COGNITO } from "@hr-attendance-app/types";

export class CognitoAuthAdapter implements AuthProviderAdapter {
  constructor(
    private readonly cognito: CognitoIdentityProviderClient,
    private readonly userPoolId: string,
  ) {}

  async createUser(input: CreateAuthUserInput): Promise<{ authUserId: string }> {
    const result = await this.cognito.send(new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: input.email,
      UserAttributes: [
        { Name: COGNITO.ATTR_EMAIL, Value: input.email },
        { Name: COGNITO.ATTR_EMAIL_VERIFIED, Value: "true" },
        { Name: COGNITO.ATTR_EMPLOYEE_ID, Value: input.employeeId },
        { Name: COGNITO.ATTR_PREFERRED_LANGUAGE, Value: input.preferredLanguage },
      ],
      DesiredDeliveryMediums: [COGNITO.DELIVERY_EMAIL],
    }));

    const authUserId = result.User?.Username ?? input.email;

    // Add to role group
    await this.cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: this.userPoolId,
      Username: authUserId,
      GroupName: input.role,
    }));

    return { authUserId };
  }

  async disableUser(authUserId: string): Promise<void> {
    await this.cognito.send(new AdminDisableUserCommand({
      UserPoolId: this.userPoolId,
      Username: authUserId,
    }));
  }

  async deleteUser(authUserId: string): Promise<void> {
    await this.cognito.send(new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: authUserId,
    }));
  }

  async setTemporaryPassword(authUserId: string, tempPassword: string): Promise<void> {
    await this.cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: authUserId,
      Password: tempPassword,
      Permanent: false,
    }));
  }

  async updateAttributes(authUserId: string, attributes: Record<string, string>): Promise<void> {
    const userAttributes = Object.entries(attributes).map(([key, value]) => ({
      Name: key,
      Value: value,
    }));

    await this.cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: authUserId,
      UserAttributes: userAttributes,
    }));
  }
}
