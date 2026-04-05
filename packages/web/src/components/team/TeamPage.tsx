import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  PageLayout, Card, Tabs, Badge, Calendar, EmptyState,
  ButtonAccent, ButtonDanger, FormField,
} from "../ui";
import { useToast } from "../ui/Toast";
import {
  useTeamMembers, useFlags, usePendingLeaveRequests, useLeaveRequests,
  useApproveLeave, useRejectLeave, useResolveFlag, useBank, useBankApprove,
  useTeamReports, useTeamAttendanceStates, usePendingCounts,
  useEmployeeAttendanceEvents,
} from "../../hooks/queries";
import { useIsManager } from "../../hooks/useRole";
import { formatDate, formatTime, isoToLocalDate } from "../../utils/date";
import { ATTENDANCE_STATUS_CONFIG } from "../../utils/attendance-status";
import { AttendanceStates, AttendanceActions, BankApprovalStatuses, FlagResolutions, FlagStatuses, LeaveRequestStatuses, calculateDailyHours, isoToDateStr, nowIso } from "@hr-attendance-app/types";
import type { AttendanceAction, AttendanceState, Employee, LeaveRequest, Flag, BankEntry, DailyReport } from "@hr-attendance-app/types";

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

  const pending = usePendingCounts();

  const localizedTabs = useMemo(
    () => TEAM_TABS.map((tab) => ({
      key: tab.key,
      label: t(tab.label),
      ...(tab.key === "approvals" ? { badge: pending.total } : {}),
    })),
    [t, pending.total],
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
  const memberIds = useMemo(() => members?.map((m) => m.id) ?? [], [members]);
  const { data: teamStates } = useTeamAttendanceStates(memberIds);

  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    teamStates?.forEach((s) => map.set(s.employeeId, s.state));
    return map;
  }, [teamStates]);

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;
  if (!members?.length) return <EmptyState message={t("team.noMembers")} />;

  return (
    <MemberGrid>
      {members.map((m) => {
        const state: AttendanceState = (stateMap.get(m.id) ?? AttendanceStates.IDLE) as AttendanceState;
        const config = ATTENDANCE_STATUS_CONFIG[state];
        return (
          <MemberCard key={m.id}>
            <AvatarWrapper>
              <Avatar>{m.name.charAt(0).toUpperCase()}</Avatar>
              <StatusDot $variant={config.variant} />
            </AvatarWrapper>
            <MemberInfo>
              <MemberNameRow>
                <MemberName>{m.name}</MemberName>
                <Badge label={t(config.labelKey)} variant={config.variant} />
              </MemberNameRow>
              <MemberMeta>
                {t(`team.employmentType.${m.employmentType}`)} · {t(`team.region.${m.region}`)}
              </MemberMeta>
            </MemberInfo>
          </MemberCard>
        );
      })}
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
  const rejectLeave = useRejectLeave();
  const resolveFlag = useResolveFlag();
  const bankApprove = useBankApprove();

  const pendingFlags = useMemo(() => flags?.filter((f) => f.status === FlagStatuses.PENDING) ?? [], [flags]);
  const pendingBank = useMemo(() => bankEntries?.filter((b) => b.approvalStatus === BankApprovalStatuses.PENDING) ?? [], [bankEntries]);

  const handleLeaveApprove = useCallback((id: string) => {
    approveLeave.mutate(id, {
      onSuccess: () => toast.show(t("team.approval.approved"), "success"),
    });
  }, [approveLeave, toast, t]);

  const handleLeaveReject = useCallback((id: string) => {
    rejectLeave.mutate({ requestId: id }, {
      onSuccess: () => toast.show(t("team.approval.rejected"), "success"),
    });
  }, [rejectLeave, toast, t]);

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
            <ButtonDanger onClick={() => handleLeaveReject(req.id)} disabled={rejectLeave.isPending}>
              {t("leave.reject")}
            </ButtonDanger>
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

const ACTION_BADGE: Record<AttendanceAction, "success" | "danger" | "warning" | "info"> = {
  [AttendanceActions.CLOCK_IN]: "success",
  [AttendanceActions.CLOCK_OUT]: "danger",
  [AttendanceActions.BREAK_START]: "warning",
  [AttendanceActions.BREAK_END]: "info",
};

const TeamReports = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(() => isoToLocalDate(nowIso()));
  const { data: members } = useTeamMembers();
  const { data: reports, isLoading } = useTeamReports(date);
  const { data: teamStates } = useTeamAttendanceStates(
    useMemo(() => members?.map((m) => m.id) ?? [], [members]),
  );

  // Map reports by employeeId for quick lookup
  const reportMap = useMemo(() => {
    const map = new Map<string, DailyReport>();
    reports?.forEach((r) => map.set(r.employeeId, r));
    return map;
  }, [reports]);

  // Map states for hours info
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    teamStates?.forEach((s) => map.set(s.employeeId, s.state));
    return map;
  }, [teamStates]);

  return (
    <Card>
      <FilterRow>
        <FormField>
          <label htmlFor="report-date">{t("team.reports.date")}</label>
          <input id="report-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </FilterRow>

      {isLoading && <p>{t("common.loading")}</p>}
      {!isLoading && !members?.length && <EmptyState message={t("team.noMembers")} />}
      {!isLoading && !!members?.length && (
        <ReportList>
          {members.map((member) => (
            <MemberReportRow
              key={member.id}
              member={member}
              report={reportMap.get(member.id) ?? null}
              state={stateMap.get(member.id) ?? AttendanceStates.IDLE}
              date={date}
              t={t}
            />
          ))}
        </ReportList>
      )}
    </Card>
  );
};

const MemberReportRow = ({
  member,
  report,
  state,
  date,
  t,
}: {
  readonly member: Employee;
  readonly report: DailyReport | null;
  readonly state: string;
  readonly date: string;
  readonly t: (key: string, opts?: Record<string, unknown>) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { data: events } = useEmployeeAttendanceEvents(member.id, date, true);
  const hasWorked = state !== AttendanceStates.IDLE || (events && events.length > 0);

  const hours = useMemo(() => {
    if (!events || events.length === 0) return null;
    const breakdown = calculateDailyHours(events, 0);
    return { worked: breakdown.workedHours, breakMins: Math.round(breakdown.breakHours * 60) };
  }, [events]);

  return (
    <ReportItem>
      <ReportHeader>
        <ReportAuthor>{member.name}</ReportAuthor>
        <ReportMeta>
          {hours && hours.worked > 0 && (
            <Badge label={t("team.reports.workedHours", { hours: hours.worked })} variant="success" />
          )}
          {hours && hours.breakMins > 0 && (
            <Badge label={`${hours.breakMins}m ${t("dashboard.totalBreak").toLowerCase()}`} variant="warning" />
          )}
          {!report && hasWorked && (
            <Badge label={t("team.reports.noReport")} variant="danger" />
          )}
          {report && <Badge label={formatDate(report.date)} variant="info" />}
        </ReportMeta>
      </ReportHeader>

      {report && <ReportBody>{report.yesterday}</ReportBody>}
      {!report && !hasWorked && (
        <NoActivityText>{t("team.reports.none")}</NoActivityText>
      )}

      <AttendanceToggle onClick={() => setExpanded((v) => !v)}>
        {expanded ? t("team.reports.hideAttendance") : t("team.reports.viewAttendance")}
      </AttendanceToggle>

      {expanded && events && events.length > 0 && (
        <AttendanceDetail>
          {events.map((e) => (
            <AttendanceRow key={e.id}>
              <AttendanceTime>{formatTime(e.timestamp)}</AttendanceTime>
              <Badge label={t(`attendance.action.${e.action}`)} variant={ACTION_BADGE[e.action]} />
            </AttendanceRow>
          ))}
        </AttendanceDetail>
      )}
      {expanded && (!events || events.length === 0) && (
        <AttendanceDetail>
          <NoActivityText>{t("attendance.noRecords")}</NoActivityText>
        </AttendanceDetail>
      )}
    </ReportItem>
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

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
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
`;

const STATUS_DOT_COLORS = {
  success: "success",
  info: "info",
  warning: "warning",
  danger: "textMuted",
} as const;

const StatusDot = styled.div<{ $variant: string }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid ${({ theme }) => theme.colors.background};
  background: ${({ theme, $variant }) =>
    theme.colors[STATUS_DOT_COLORS[$variant as keyof typeof STATUS_DOT_COLORS] as keyof typeof theme.colors] ?? theme.colors.textMuted};
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const MemberNameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
`;

const MemberName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const MemberMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

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

const ReportMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  align-items: center;
`;

const ReportBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  white-space: pre-wrap;
`;

const AttendanceToggle = styled.button`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.space.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-top: ${({ theme }) => theme.space.xs};

  &:hover {
    text-decoration: underline;
  }
`;

const AttendanceDetail = styled.div`
  margin-top: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const AttendanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const AttendanceTime = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 50px;
`;

const NoActivityText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`;
