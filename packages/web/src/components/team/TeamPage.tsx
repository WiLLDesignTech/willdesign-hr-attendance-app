import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  PageLayout, Card, Tabs, Badge, Calendar, EmptyState,
  ButtonAccent, FormField,
} from "../ui";
import { useToast } from "../ui/Toast";
import {
  useTeamMembers, useFlags, usePendingLeaveRequests, useLeaveRequests,
  useApproveLeave, useResolveFlag, useBank, useBankApprove,
  useReports,
} from "../../hooks/queries";
import { useIsManager } from "../../hooks/useRole";
import { formatDate, formatDateTime } from "../../utils/date";
import { FlagResolutions, FlagStatuses, LeaveRequestStatuses, isoToDateStr, todayDate } from "@hr-attendance-app/types";
import type { LeaveRequest, Flag, BankEntry, DailyReport } from "@hr-attendance-app/types";

const TEAM_TABS = [
  { key: "overview", label: "team.tab.overview" },
  { key: "approvals", label: "team.tab.approvals" },
  { key: "calendar", label: "team.tab.calendar" },
  { key: "reports", label: "team.tab.reports" },
] as const;

export const TeamPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const isManager = useIsManager();

  const localizedTabs = useMemo(
    () => TEAM_TABS.map((tab) => ({ key: tab.key, label: t(tab.label) })),
    [t],
  );

  return (
    <PageLayout>
      <Tabs tabs={localizedTabs} activeKey={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" && <TeamOverview />}
      {activeTab === "approvals" && <ApprovalQueue />}
      {activeTab === "calendar" && <TeamCalendar isManager={isManager} />}
      {activeTab === "reports" && <TeamReports />}
    </PageLayout>
  );
};

/* ─── Team Overview ─── */

const TeamOverview = () => {
  const { t } = useTranslation();
  const { data: members, isLoading } = useTeamMembers();

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;
  if (!members?.length) return <EmptyState message={t("team.noMembers")} />;

  return (
    <MemberGrid>
      {members.map((m) => (
        <MemberCard key={m.id}>
          <Avatar>{m.name.charAt(0).toUpperCase()}</Avatar>
          <MemberInfo>
            <MemberName>{m.name}</MemberName>
            <MemberMeta>
              <Badge label={t(`team.employmentType.${m.employmentType}`)} variant="info" />
              <Badge label={t(`team.region.${m.region}`)} variant="info" />
            </MemberMeta>
            <StatusBadge>
              <Badge label={t("team.status.idle")} variant="success" />
            </StatusBadge>
          </MemberInfo>
        </MemberCard>
      ))}
    </MemberGrid>
  );
};

/* ─── Approval Queue ─── */

const ApprovalQueue = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const { data: pendingLeave } = usePendingLeaveRequests({ enabled: true });
  const { data: flags } = useFlags();
  const { data: bankEntries } = useBank();
  const approveLeave = useApproveLeave();
  const resolveFlag = useResolveFlag();
  const bankApprove = useBankApprove();

  const pendingFlags = useMemo(() => flags?.filter((f) => f.status === FlagStatuses.PENDING) ?? [], [flags]);
  const BANK_PENDING: BankEntry["approvalStatus"] = "PENDING";
  const pendingBank = useMemo(() => bankEntries?.filter((b) => b.approvalStatus === BANK_PENDING) ?? [], [bankEntries]);

  const handleLeaveApprove = useCallback((id: string) => {
    approveLeave.mutate(id, {
      onSuccess: () => toast.show(t("team.approval.approved"), "success"),
    });
  }, [approveLeave, toast, t]);

  const handleFlagResolve = useCallback((flagId: string, resolution: string) => {
    resolveFlag.mutate(
      { flagId, resolution },
      { onSuccess: () => toast.show(t("team.approval.resolved"), "success") },
    );
  }, [resolveFlag, toast, t]);

  const handleBankApprove = useCallback((entryId: string) => {
    bankApprove.mutate(
      { entryId },
      { onSuccess: () => toast.show(t("team.approval.bankApproved"), "success") },
    );
  }, [bankApprove, toast, t]);

  const hasItems = (pendingLeave?.length ?? 0) > 0 || pendingFlags.length > 0 || pendingBank.length > 0;

  if (!hasItems) return <EmptyState message={t("team.approval.none")} />;

  return (
    <QueueList>
      {pendingLeave?.map((req: LeaveRequest) => (
        <QueueItem key={req.id}>
          <QueueBadge><Badge label={t("team.approval.leave")} variant="info" /></QueueBadge>
          <QueueContent>
            <QueueTitle>{req.employeeId}</QueueTitle>
            <QueueMeta>
              {t(`leave.type.${req.leaveType}`)} · {formatDate(req.startDate)} → {formatDate(req.endDate)}
            </QueueMeta>
            {req.reason && <QueueReason>{req.reason}</QueueReason>}
          </QueueContent>
          <QueueActions>
            <ButtonAccent onClick={() => handleLeaveApprove(req.id)} disabled={approveLeave.isPending}>
              {t("leave.approve")}
            </ButtonAccent>
          </QueueActions>
        </QueueItem>
      ))}

      {pendingFlags.map((flag: Flag) => (
        <QueueItem key={flag.id}>
          <QueueBadge><Badge label={t("team.approval.flag")} variant="warning" /></QueueBadge>
          <QueueContent>
            <QueueTitle>{flag.employeeId}</QueueTitle>
            <QueueMeta>
              {flag.level} · {flag.period} · {flag.deficitHours}h {t("team.approval.deficit")}
            </QueueMeta>
          </QueueContent>
          <QueueActions>
            <ResolveSelect onChange={(e) => e.target.value && handleFlagResolve(flag.id, e.target.value)} defaultValue="">
              <option value="">{t("team.approval.resolve")}</option>
              <option value={FlagResolutions.NO_PENALTY}>{t("team.approval.noPenalty")}</option>
              <option value={FlagResolutions.DEDUCT_FULL}>{t("team.approval.deductFull")}</option>
              <option value={FlagResolutions.USE_BANK}>{t("team.approval.useBank")}</option>
              <option value={FlagResolutions.PARTIAL_BANK}>{t("team.approval.partialBank")}</option>
              <option value={FlagResolutions.DISCUSS}>{t("team.approval.discuss")}</option>
            </ResolveSelect>
          </QueueActions>
        </QueueItem>
      ))}

      {pendingBank.map((entry: BankEntry) => (
        <QueueItem key={entry.id}>
          <QueueBadge><Badge label={t("team.approval.bank")} variant="success" /></QueueBadge>
          <QueueContent>
            <QueueTitle>{entry.employeeId}</QueueTitle>
            <QueueMeta>
              {entry.surplusHours}h · {entry.yearMonth}
            </QueueMeta>
          </QueueContent>
          <QueueActions>
            <ButtonAccent onClick={() => handleBankApprove(entry.id)} disabled={bankApprove.isPending}>
              {t("leave.approve")}
            </ButtonAccent>
          </QueueActions>
        </QueueItem>
      ))}
    </QueueList>
  );
};

/* ─── Team Calendar ─── */

const TeamCalendar = ({ isManager }: { readonly isManager: boolean }) => {
  const { t } = useTranslation();
  const { data: allLeave } = useLeaveRequests();

  const approvedLeave = useMemo(
    () => allLeave?.filter((r) => r.status === LeaveRequestStatuses.APPROVED) ?? [],
    [allLeave],
  );

  const highlightedDates = useMemo(() => {
    const dates = new Set<string>();
    approvedLeave.forEach((r) => {
      dates.add(isoToDateStr(r.startDate));
    });
    return dates;
  }, [approvedLeave]);

  return (
    <Card>
      <Calendar highlightedDates={highlightedDates} />
      <LeaveList>
        {approvedLeave.length === 0 ? (
          <EmptyState message={t("team.calendar.noLeave")} />
        ) : (
          approvedLeave.map((r) => (
            <LeaveRow key={r.id}>
              <span>{r.employeeId}</span>
              <span>{formatDate(r.startDate)} → {formatDate(r.endDate)}</span>
              {isManager && <Badge label={t(`leave.type.${r.leaveType}`)} variant="info" />}
            </LeaveRow>
          ))
        )}
      </LeaveList>
    </Card>
  );
};

/* ─── Team Reports ─── */

const TeamReports = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(() => todayDate());

  const { data: reports, isLoading } = useReports(date);

  return (
    <Card>
      <FilterRow>
        <FormField>
          <label htmlFor="report-date">{t("team.reports.date")}</label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FormField>
      </FilterRow>

      {isLoading ? (
        <p>{t("common.loading")}</p>
      ) : !reports?.length ? (
        <EmptyState message={t("team.reports.none")} />
      ) : (
        <ReportList>
          {reports.map((report: DailyReport) => (
            <ReportItem key={report.id}>
              <ReportHeader>
                <ReportAuthor>{report.employeeId}</ReportAuthor>
                <ReportTime>{formatDateTime(report.createdAt)}</ReportTime>
              </ReportHeader>
              <ReportBody>{report.yesterday}</ReportBody>
              {report.references.length > 0 && (
                <RefList>
                  {report.references.map((ref, i) => (
                    <RefBadge key={i}>
                      <Badge label={`${ref.type}: ${ref.id}`} variant="info" />
                    </RefBadge>
                  ))}
                </RefList>
              )}
            </ReportItem>
          ))}
        </ReportList>
      )}
    </Card>
  );
};

/* ─── Styled Components ─── */

const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const MemberCard = styled(Card)`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textInverse};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  min-width: 0;
`;

const MemberName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const MemberMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  flex-wrap: wrap;
`;

const StatusBadge = styled.div``;

/* Approval Queue */

const QueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const QueueItem = styled(Card)`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const QueueBadge = styled.div`
  flex-shrink: 0;
`;

const QueueContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const QueueTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const QueueMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const QueueReason = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const QueueActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  flex-shrink: 0;
`;

const ResolveSelect = styled.select`
  padding: ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  min-height: 44px;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

/* Calendar */

const LeaveList = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const LeaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

/* Reports */

const FilterRow = styled.div`
  margin-bottom: ${({ theme }) => theme.space.md};
  max-width: 200px;
`;

const ReportList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const ReportItem = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const ReportAuthor = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const ReportTime = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ReportBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  white-space: pre-wrap;
`;

const RefList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.space.sm};
`;

const RefBadge = styled.span``;
