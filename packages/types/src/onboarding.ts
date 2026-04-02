export type TerminationType =
  | "WITHOUT_CAUSE"
  | "FOR_CAUSE"
  | "MUTUAL"
  | "RESIGNATION";

export interface LegalObligation {
  readonly type: string;
  readonly description: string;
  readonly expiresAt: string;
}

export interface OffboardingRecord {
  readonly employeeId: string;
  readonly terminationType: TerminationType;
  readonly terminationDate: string;
  readonly noticePeriodBuyout: boolean;
  readonly buyoutAmount: number | null;
  readonly settlementDeadline: string;
  readonly curePeriodExpiry: string | null;
  readonly legalObligations: readonly LegalObligation[];
  readonly createdAt: string;
}
