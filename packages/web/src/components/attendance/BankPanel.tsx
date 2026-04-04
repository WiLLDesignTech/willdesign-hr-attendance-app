import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, EmptyState, ProgressBar } from "../ui";
import { useBank } from "../../hooks/queries";
import { formatDate } from "../../utils/date";
import { BANKING, nowMs } from "@hr-attendance-app/types";

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

/** No BankApprovalStatuses in types yet — local typed constants until added */
const BankStatus = {
  PENDING: "PENDING" as const,
  APPROVED: "APPROVED" as const,
};

const APPROVAL_LABEL_MAP: Record<string, string> = {
  [BankStatus.APPROVED]: "bank.approvedStatus",
  [BankStatus.PENDING]: "bank.awaitingApproval",
};

const APPROVAL_VARIANT_MAP: Record<string, "success" | "warning" | "info"> = {
  [BankStatus.APPROVED]: "success",
  [BankStatus.PENDING]: "warning",
};

const getApprovalLabel = (status: string, t: (key: string) => string): string => {
  const key = APPROVAL_LABEL_MAP[status];
  return key ? t(key) : status;
};

const getApprovalVariant = (status: string): "success" | "warning" | "info" => {
  return APPROVAL_VARIANT_MAP[status] ?? "info";
};

export const BankPanel = () => {
  const { t } = useTranslation();
  const { data: entries, isLoading } = useBank();

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;
  if (!entries?.length) return <EmptyState message={t("bank.none")} />;

  const approved = entries.filter((e) => e.approvalStatus === BankStatus.APPROVED);
  const pending = entries.filter((e) => e.approvalStatus === BankStatus.PENDING);
  const totalApproved = approved.reduce((s, e) => s + e.remainingHours, 0);
  const totalPending = pending.reduce((s, e) => s + e.surplusHours, 0);

  return (
    <BankContainer>
      {/* Summary */}
      <SummaryRow>
        <SummaryCard>
          <SummaryLabel>{t("bank.approved")}</SummaryLabel>
          <SummaryValue>{totalApproved}h</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>{t("bank.pending")}</SummaryLabel>
          <SummaryValue>{totalPending}h</SummaryValue>
        </SummaryCard>
      </SummaryRow>

      {/* Entry List */}
      <EntryList>
        {entries.map((entry) => {
          const expiryMs = new Date(entry.expiresAt).getTime();
          const monthsLeft = Math.max(0, Math.round((expiryMs - nowMs()) / MS_PER_MONTH));

          return (
            <EntryRow key={entry.id}>
              <EntryInfo>
                <EntryPeriod>{entry.yearMonth}</EntryPeriod>
                <EntrySurplus>{entry.surplusHours}h {t("bank.surplus")}</EntrySurplus>
                <Badge
                  label={getApprovalLabel(entry.approvalStatus, t)}
                  variant={getApprovalVariant(entry.approvalStatus)}
                />
              </EntryInfo>
              <ExpirySection>
                <ExpiryLabel>{t("bank.expiresOn")} {formatDate(entry.expiresAt)}</ExpiryLabel>
                <ProgressBar value={BANKING.EXPIRY_MONTHS - monthsLeft} max={BANKING.EXPIRY_MONTHS} variant={monthsLeft < 3 ? "danger" : "accent"} />
              </ExpirySection>
            </EntryRow>
          );
        })}
      </EntryList>
    </BankContainer>
  );
};

const BankContainer = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.md};
`;

const SummaryRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: ${({ theme }) => theme.space.md};
`;

const SummaryCard = styled(Card)`
  text-align: center;
`;

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase; margin-bottom: ${({ theme }) => theme.space.xs};
`;

const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading}; color: ${({ theme }) => theme.colors.accent};
`;

const EntryList = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.sm};
`;

const EntryRow = styled(Card)`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.sm};
`;

const EntryInfo = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm}; flex-wrap: wrap;
`;

const EntryPeriod = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const EntrySurplus = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.success};
`;

const ExpirySection = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.xs};
`;

const ExpiryLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
`;
