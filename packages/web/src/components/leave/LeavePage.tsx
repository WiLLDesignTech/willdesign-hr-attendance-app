import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { LeaveTypes, LeaveRequestStatuses, Permissions, isoToDateStr, JP_LABOR } from "@hr-attendance-app/types";
import { Card, PageLayout, Tabs, Calendar, Badge, ProgressBar, FormField, FormLayout, ButtonAccent, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import {
  useLeaveRequests, useCreateLeave, useLeaveBalance,
  usePendingLeaveRequests, useApproveLeave,
} from "../../hooks/queries/useLeave";
import { formatDate } from "../../utils/date";
import { useHasPermission, useIsManager } from "../../hooks/useRole";

const LEAVE_TABS = [
  { key: "my", label: "leave.tab.my" },
  { key: "calendar", label: "leave.tab.calendar" },
  { key: "balance", label: "leave.tab.balance" },
] as const;

const ALL_LEAVE_TYPES = [
  LeaveTypes.PAID, LeaveTypes.UNPAID, LeaveTypes.SHIFT_PERMISSION,
  LeaveTypes.CREDITED_ABSENCE, LeaveTypes.BEREAVEMENT, LeaveTypes.MATERNITY,
  LeaveTypes.NURSING, LeaveTypes.MENSTRUAL, LeaveTypes.COMPANY_SPECIFIC,
] as const;


const getLeaveStatusVariant = (status: string): "success" | "danger" | "warning" => {
  if (status === LeaveRequestStatuses.APPROVED) return "success";
  if (status === LeaveRequestStatuses.REJECTED) return "danger";
  return "warning";
};

export const LeavePage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("my");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<string>(LeaveTypes.PAID);
  const [reason, setReason] = useState("");

  const canApprove = useHasPermission(Permissions.LEAVE_APPROVE);
  const isManager = useIsManager();
  const { data: requests, isLoading } = useLeaveRequests();
  const { data: balance } = useLeaveBalance();
  const { data: pendingRequests } = usePendingLeaveRequests({ enabled: canApprove });
  const createLeave = useCreateLeave();
  const approveLeave = useApproveLeave();

  const showZeroBalanceWarning = leaveType === LeaveTypes.PAID && balance && balance.paidLeaveRemaining === 0;

  const localizedTabs = useMemo(
    () => LEAVE_TABS.map((tab) => ({ key: tab.key, label: t(tab.label) })),
    [t],
  );

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    createLeave.mutate(
      { leaveType, startDate, endDate, reason },
      {
        onSuccess: () => {
          setStartDate(""); setEndDate(""); setReason("");
          toast.show(t("leave.requestCreated"), "success");
        },
      },
    );
  };

  return (
    <PageLayout>
      <Tabs tabs={localizedTabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "my" && (
        <>
          {/* Request Form */}
          <Card>
            <FormLayout onSubmit={handleSubmit}>
              <FormField>
                <label htmlFor="leave-type">{t("leave.leaveType")}</label>
                <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                  {ALL_LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`leave.type.${type}`)}</option>
                  ))}
                </select>
              </FormField>
              {showZeroBalanceWarning && (
                <WarningBox>{t("leave.zeroBalanceWarning")}</WarningBox>
              )}
              <DateRow>
                <FormField>
                  <label htmlFor="start-date">{t("leave.startDate")}</label>
                  <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </FormField>
                <FormField>
                  <label htmlFor="end-date">{t("leave.endDate")}</label>
                  <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </FormField>
              </DateRow>
              <ButtonAccent type="submit" disabled={createLeave.isPending}>
                {createLeave.isPending ? t("common.submitting") : t("leave.submit")}
              </ButtonAccent>
            </FormLayout>
          </Card>

          {/* My Requests */}
          <Card>
            {isLoading && <LoadingSpinner />}
            {!isLoading && !requests?.length && (
              <EmptyState message={t("leave.noRequests")} />
            )}
            {!isLoading && !!requests?.length && (
              <RequestList>
                {requests.map((r) => (
                  <RequestRow key={r.id}>
                    <RequestInfo>
                      <Badge label={t(`leave.type.${r.leaveType}`)} variant="info" />
                      <DateRange>{formatDate(r.startDate)} → {formatDate(r.endDate)}</DateRange>
                    </RequestInfo>
                    <Badge
                      label={t(`leave.status.${r.status}`)}
                      variant={getLeaveStatusVariant(r.status)}
                    />
                  </RequestRow>
                ))}
              </RequestList>
            )}
          </Card>

          {/* Pending Approvals (Manager) */}
          {canApprove && pendingRequests?.length ? (
            <Card>
              <h3>{t("leave.pendingApprovals")}</h3>
              <RequestList>
                {pendingRequests.map((r) => (
                  <RequestRow key={r.id}>
                    <RequestInfo>
                      <span>{r.employeeId}</span>
                      <Badge label={t(`leave.type.${r.leaveType}`)} variant="info" />
                      <DateRange>{formatDate(r.startDate)} → {formatDate(r.endDate)}</DateRange>
                    </RequestInfo>
                    <ButtonAccent
                      onClick={() => approveLeave.mutate(r.id, { onSuccess: () => toast.show(t("leave.approved"), "success") })}
                      disabled={approveLeave.isPending}
                    >
                      {t("leave.approve")}
                    </ButtonAccent>
                  </RequestRow>
                ))}
              </RequestList>
            </Card>
          ) : null}
        </>
      )}

      {activeTab === "calendar" && <LeaveCalendarTab isManager={isManager} />}

      {activeTab === "balance" && balance && (
        <Card>
          <BalanceGrid>
            <BalanceItem>
              <BalanceLabel>{t("leave.paidRemaining")}</BalanceLabel>
              <BalanceValue>{balance.paidLeaveRemaining}</BalanceValue>
            </BalanceItem>
            <BalanceItem>
              <BalanceLabel>{t("leave.carryOver")}</BalanceLabel>
              <BalanceValue>{balance.carryOver}</BalanceValue>
            </BalanceItem>
            {balance.carryOverExpiry && (
              <BalanceItem>
                <BalanceLabel>{t("leave.carryOverExpiry")}</BalanceLabel>
                <BalanceValue>{formatDate(balance.carryOverExpiry)}</BalanceValue>
              </BalanceItem>
            )}
          </BalanceGrid>
          <MandatorySection>
            <MandatoryLabel>{t("leave.mandatory5Days")}</MandatoryLabel>
            <ProgressBar value={balance.paidLeaveUsed} max={JP_LABOR.MANDATORY_LEAVE_DAYS} variant="accent" />
          </MandatorySection>
        </Card>
      )}
    </PageLayout>
  );
};

const LeaveCalendarTab = ({ isManager }: { readonly isManager: boolean }) => {
  const { t } = useTranslation();
  const { data: allLeave } = useLeaveRequests();

  const approved = useMemo(
    () => allLeave?.filter((r) => r.status === LeaveRequestStatuses.APPROVED) ?? [],
    [allLeave],
  );

  const highlighted = useMemo(() => {
    const dates = new Set<string>();
    approved.forEach((r) => dates.add(isoToDateStr(r.startDate)));
    return dates;
  }, [approved]);

  return (
    <Card>
      <Calendar highlightedDates={highlighted} />
      {approved.length === 0 ? (
        <EmptyState message={t("leave.noApprovedLeave")} />
      ) : (
        <LeaveList>
          {approved.map((r) => (
            <LeaveRow key={r.id}>
              <span>{r.employeeId}</span>
              <DateRange>{formatDate(r.startDate)} → {formatDate(r.endDate)}</DateRange>
              {isManager && <Badge label={t(`leave.type.${r.leaveType}`)} variant="info" />}
            </LeaveRow>
          ))}
        </LeaveList>
      )}
    </Card>
  );
};

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) { grid-template-columns: 1fr; }
`;

const WarningBox = styled.div`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
`;

const RequestList = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.xs};
`;

const RequestRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  gap: ${({ theme }) => theme.space.sm};
  &:last-child { border-bottom: none; }
`;

const RequestInfo = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm}; flex-wrap: wrap;
`;

const DateRange = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textMuted};
`;

const BalanceGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: ${({ theme }) => theme.space.md};
`;

const BalanceItem = styled.div`
  text-align: center; padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface}; border-radius: ${({ theme }) => theme.radii.md};
`;

const BalanceLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase; margin-bottom: ${({ theme }) => theme.space.xs};
`;

const BalanceValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading}; color: ${({ theme }) => theme.colors.accent};
`;

const MandatorySection = styled.div`
  margin-top: ${({ theme }) => theme.space.md}; padding-top: ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const MandatoryLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const LeaveList = styled.div`
  margin-top: ${({ theme }) => theme.space.md}; display: flex; flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const LeaveRow = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm}; font-size: ${({ theme }) => theme.fontSizes.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;
