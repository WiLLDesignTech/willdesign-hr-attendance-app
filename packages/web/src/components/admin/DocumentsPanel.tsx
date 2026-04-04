import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, ButtonAccent, ButtonDanger, ButtonSecondary, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import { useDocuments, useUploadDocument, useVerifyDocument } from "../../hooks/queries";
import { formatDate } from "../../utils/date";
import { DocumentVerificationStatuses } from "@hr-attendance-app/types";
import { useIsAdmin } from "../../hooks/useRole";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface DocumentsPanelProps {
  readonly employeeId: string;
}

export const DocumentsPanel = ({ employeeId }: DocumentsPanelProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { data: documents, isLoading } = useDocuments(employeeId);
  const upload = useUploadDocument();
  const verify = useVerifyDocument();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(t("documents.fileTooLarge"));
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError(t("documents.invalidType"));
      return;
    }

    upload.mutate(
      { employeeId, fileName: file.name, fileType: file.type, documentType: "other" },
      {
        onSuccess: () => {
          toast.show(t("documents.uploaded"), "success");
        },
        onError: (err) => {
          setUploadError(err.message);
        },
      },
    );
  };

  const handleVerify = (docId: string, status: "VERIFIED" | "REJECTED") => {
    verify.mutate(
      { id: docId, body: { status } },
      { onSuccess: () => toast.show(t("documents.verified"), "success") },
    );
  };

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;

  return (
    <DocContainer>
      {/* Upload */}
      <UploadRow>
        <HiddenInput
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileSelect}
        />
        <ButtonAccent onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? t("common.submitting") : t("documents.upload")}
        </ButtonAccent>
        {uploadError && <ErrorText>{uploadError}</ErrorText>}
      </UploadRow>

      {/* Document List */}
      {!documents?.length ? (
        <EmptyState message={t("documents.none")} />
      ) : (
        <DocList>
          {documents.map((doc) => (
            <DocRow key={doc.id}>
              <DocInfo>
                <DocName>{doc.fileName}</DocName>
                <DocMeta>{formatDate(doc.uploadedAt)}</DocMeta>
                {doc.verificationStatus && (
                  <Badge
                    label={doc.verificationStatus}
                    variant={
                      doc.verificationStatus === DocumentVerificationStatuses.VERIFIED ? "success"
                      : doc.verificationStatus === DocumentVerificationStatuses.REJECTED ? "danger"
                      : "warning"
                    }
                  />
                )}
              </DocInfo>
              {isAdmin && doc.verificationStatus === DocumentVerificationStatuses.PENDING && (
                <DocActions>
                  <ButtonSecondary onClick={() => handleVerify(doc.id, "VERIFIED")}>
                    {t("documents.verify")}
                  </ButtonSecondary>
                  <ButtonDanger onClick={() => handleVerify(doc.id, "REJECTED")}>
                    {t("documents.reject")}
                  </ButtonDanger>
                </DocActions>
              )}
            </DocRow>
          ))}
        </DocList>
      )}
    </DocContainer>
  );
};

const DocContainer = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.md};
`;

const UploadRow = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.md};
`;

const HiddenInput = styled.input`
  display: none;
`;

const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.danger};
`;

const DocList = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.sm};
`;

const DocRow = styled(Card)`
  display: flex; align-items: center; justify-content: space-between; gap: ${({ theme }) => theme.space.md};
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column; align-items: flex-start;
  }
`;

const DocInfo = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm}; flex-wrap: wrap;
`;

const DocName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const DocMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
`;

const DocActions = styled.div`
  display: flex; gap: ${({ theme }) => theme.space.xs};
`;
