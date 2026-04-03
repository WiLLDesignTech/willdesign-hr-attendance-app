import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { LeaveTypes, LeaveRequestStatuses } from "@willdesign-hr/types";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useLeaveRequests, useCreateLeave, useLeaveBalance } from "../../hooks/queries/useLeave";
import { formatDate } from "../../utils/date";

const RequestList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RequestItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`;

function getStatusColor(status: string, theme: { colors: { success: string; warning: string; accent: string } }): string {
  if (status === LeaveRequestStatuses.APPROVED) return theme.colors.success;
  if (status === LeaveRequestStatuses.REJECTED) return theme.colors.warning;
  return theme.colors.accent;
}

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.background};
  background: ${({ $status, theme }) => getStatusColor($status, theme)};
`;

const DateRange = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const BalanceCard = styled(Card)`
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
`;

const BalanceValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.accent};
`;

export function LeavePage() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<string>(LeaveTypes.PAID);
  const [reason, setReason] = useState("");

  const { data: requests, isLoading } = useLeaveRequests();
  const { data: balance } = useLeaveBalance();
  const createLeave = useCreateLeave();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    createLeave.mutate(
      { leaveType, startDate, endDate, reason },
      { onSuccess: () => { setStartDate(""); setEndDate(""); setReason(""); } },
    );
  };

  return (
    <PageLayout>
      {balance && (
        <BalanceCard>
          <TextMuted>{t("leave.balanceRemaining")}</TextMuted>
          <BalanceValue>{balance.paidLeaveRemaining}</BalanceValue>
        </BalanceCard>
      )}

      <Card>
        <SectionTitle>{t("leave.newRequest")}</SectionTitle>
        <FormLayout onSubmit={handleSubmit}>
          <FormField>
            <label htmlFor="leave-type">{t("leave.leaveType")}</label>
            <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option value={LeaveTypes.PAID}>{t("leave.paid")}</option>
              <option value={LeaveTypes.UNPAID}>{t("leave.unpaid")}</option>
              <option value={LeaveTypes.SHIFT_PERMISSION}>{t("leave.shiftPermission")}</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="start-date">{t("leave.startDate")}</label>
            <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="end-date">{t("leave.endDate")}</label>
            <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
          <ButtonAccent type="submit" disabled={createLeave.isPending}>
            {createLeave.isPending ? t("common.loading") : t("leave.submit")}
          </ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>{t("leave.myRequests")}</SectionTitle>
        {isLoading ? (
          <LoadingSpinner />
        ) : !requests?.length ? (
          <TextMuted>{t("leave.noRequests")}</TextMuted>
        ) : (
          <RequestList>
            {requests.map((r) => (
              <RequestItem key={r.id}>
                <div>
                  <strong>{t(`leave.type.${r.leaveType}`)}</strong>
                  <DateRange>
                    {formatDate(r.startDate)} — {formatDate(r.endDate)}
                  </DateRange>
                </div>
                <StatusBadge $status={r.status}>{t(`leave.status.${r.status}`)}</StatusBadge>
              </RequestItem>
            ))}
          </RequestList>
        )}
      </Card>
    </PageLayout>
  );
}
