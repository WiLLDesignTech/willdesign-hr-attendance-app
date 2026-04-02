export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface Document {
  readonly id: string;
  readonly employeeId: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly s3Key: string;
  readonly verificationStatus: DocumentVerificationStatus;
  readonly verifiedBy?: string;
  readonly uploadedAt: string;
}
