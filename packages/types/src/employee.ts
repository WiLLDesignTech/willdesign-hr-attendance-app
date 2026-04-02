export type Region = "JP" | "NP";

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type EmploymentType =
  | "JP_FULL_TIME"
  | "JP_CONTRACT"
  | "JP_OUTSOURCED"
  | "JP_PART_TIME"
  | "JP_SALES"
  | "JP_INTERN"
  | "NP_FULL_TIME"
  | "NP_PAID_INTERN"
  | "NP_UNPAID_INTERN";

export type LanguagePreference = "en" | "ja" | "ne";

export interface Employee {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly slackId: string;
  readonly employmentType: EmploymentType;
  readonly region: Region;
  readonly timezone: string;
  readonly languagePreference: LanguagePreference;
  readonly managerId: string | null;
  readonly status: EmployeeStatus;
  readonly joinDate: string;
  readonly probationEndDate: string | null;
  readonly terminationDate?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
