import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AttendanceStates, EmployeeStatuses, ROUTES, currentYear, todayDate } from "@hr-attendance-app/types";
import type { Employee, AttendanceStateRecord } from "@hr-attendance-app/types";
import { ClockWidget } from "./ClockWidget";
import { Card, PageLayout, ProgressBar, Badge } from "../ui";
import {
  useAttendanceState, useAttendanceSummary, useAttendanceEvents,
  useClockAction, useTeamAttendanceStates,
} from "../../hooks/queries/useAttendance";
import { useLeaveBalance } from "../../hooks/queries/useLeave";
import { useCurrentUser, useEmployees } from "../../hooks/queries/useEmployee";
import { useTeamMembers, useHolidays, usePendingCounts } from "../../hooks/queries";
import { useIsManager, useIsAdmin } from "../../hooks/useRole";
import { useToast } from "../ui/Toast";
import { formatDate } from "../../utils/date";
import { formatClockError, ATTENDANCE_STATUS_CONFIG } from "../../utils/attendance-status";
import type { ThemeColorKey } from "../../utils/attendance-status";


export const DashboardPage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: attState, isLoading: attLoading } = useAttendanceState();
  const { data: summary } = useAttendanceSummary();
  const { data: todayEvents } = useAttendanceEvents(todayDate());
  const clockAction = useClockAction();
  const { data: balance } = useLeaveBalance();
  const userRegion = currentUser?.region ?? "JP";
  const { data: holidays } = useHolidays(userRegion, currentYear());
  const isManager = useIsManager();
  const isAdmin = useIsAdmin();

  const status = attState?.state ?? AttendanceStates.IDLE;
  const hoursToday = summary?.hoursToday ?? 0;
  const hoursWeek = summary?.hoursWeek ?? 0;
  const hoursMonth = summary?.hoursMonth ?? 0;
  const breakMinutesToday = summary?.breakMinutesToday ?? 0;
  const requiredDaily = summary?.requiredDaily ?? 8;
  const requiredWeekly = summary?.requiredWeekly ?? 40;
  const requiredMonthly = summary?.requiredMonthly ?? 160;

  const upcomingHolidays = holidays?.slice(0, 3) ?? [];

  return (
    <PageLayout>
      <ClockSection>
        <ClockWidget
          status={status}
          hoursToday={hoursToday}
          breakMinutesToday={breakMinutesToday}
          lastEventTimestamp={attState?.lastEventTimestamp ?? null}
          todayEvents={todayEvents ?? []}
          onAction={(action) => clockAction.mutate(action, {
            onError: (err) => toast.show(formatClockError(err, t), "danger"),
          })}
          loading={clockAction.isPending || attLoading}
        />
      </ClockSection>

      <StatsGrid>
        <StatCard>
          <StatLabel>{t("dashboard.hoursToday")}</StatLabel>
          <ProgressBar value={hoursToday} max={requiredDaily} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursWeek")}</StatLabel>
          <ProgressBar value={hoursWeek} max={requiredWeekly} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursMonth")}</StatLabel>
          <ProgressBar value={hoursMonth} max={requiredMonthly} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.leaveBalance")}</StatLabel>
          <BalanceValue>{balance?.paidLeaveRemaining ?? 0} {t("dashboard.days")}</BalanceValue>
        </StatCard>
      </StatsGrid>

      <QuickActions>
        <ActionLink to={ROUTES.LEAVE}>{t("dashboard.newLeave")}</ActionLink>
        <ActionLink to={ROUTES.REPORTS}>{t("dashboard.viewReports")}</ActionLink>
        <ActionLink to={ROUTES.PAYROLL}>{t("dashboard.viewPayroll")}</ActionLink>
        {isManager && <ActionLink to={ROUTES.TEAM}>{t("dashboard.viewTeam")}</ActionLink>}
      </QuickActions>

      {upcomingHolidays.length > 0 && (
        <Card>
          <SectionTitle>{t("dashboard.upcomingHolidays")}</SectionTitle>
          {upcomingHolidays.map((h) => (
            <HolidayRow key={`${h.region}-${h.date}`}>
              <span>{formatDate(h.date)}</span>
              <Badge label={h.name} variant="info" />
            </HolidayRow>
          ))}
        </Card>
      )}

      {isManager && <ManagerSection />}
      {isAdmin && <AdminSection />}
    </PageLayout>
  );
};

/* ── Manager: Team At-a-Glance + Pending Actions ── */

const ManagerSection = () => {
  const { t } = useTranslation();
  const { data: members } = useTeamMembers();
  const memberIds = useMemo(() => members?.map((m) => m.id) ?? [], [members]);
  const { data: teamStates } = useTeamAttendanceStates(memberIds);
  const pending = usePendingCounts();

  const stateMap = useMemo(() => {
    const map = new Map<string, AttendanceStateRecord>();
    teamStates?.forEach((s) => map.set(s.employeeId, s));
    return map;
  }, [teamStates]);

  const counts = useMemo(() => {
    let working = 0;
    let onBreak = 0;
    let idle = 0;
    teamStates?.forEach((s) => {
      if (s.state === AttendanceStates.CLOCKED_IN) working++;
      else if (s.state === AttendanceStates.ON_BREAK) onBreak++;
      else idle++;
    });
    return { working, onBreak, idle };
  }, [teamStates]);

  return (
    <>
      <Divider />

      {/* Team Status */}
      <Card>
        <SectionHeader>
          <SectionTitle>{t("dashboard.teamOverview")}</SectionTitle>
          <ActionLink to={ROUTES.TEAM}>{t("dashboard.viewAll")}</ActionLink>
        </SectionHeader>

        <TeamCountsRow>
          <TeamCount>
            <CountValue $color="accent">{counts.working}</CountValue>
            <CountLabel>{t("dashboard.working")}</CountLabel>
          </TeamCount>
          <TeamCount>
            <CountValue $color="warning">{counts.onBreak}</CountValue>
            <CountLabel>{t("dashboard.onBreak")}</CountLabel>
          </TeamCount>
          <TeamCount>
            <CountValue $color="textMuted">{counts.idle}</CountValue>
            <CountLabel>{t("dashboard.idle")}</CountLabel>
          </TeamCount>
        </TeamCountsRow>

        {members && members.length > 0 && (
          <TeamList>
            {members.map((m) => {
              const state = stateMap.get(m.id);
              const statusKey = state?.state ?? AttendanceStates.IDLE;
              const config = ATTENDANCE_STATUS_CONFIG[statusKey];
              return (
                <TeamMemberRow key={m.id}>
                  <MemberAvatar>{m.name.charAt(0).toUpperCase()}</MemberAvatar>
                  <MemberName>{m.name}</MemberName>
                  <Badge label={t(config.labelKey)} variant={config.variant} />
                </TeamMemberRow>
              );
            })}
          </TeamList>
        )}
      </Card>

      {pending.total > 0 && (
        <Card>
          <SectionHeader>
            <SectionTitle>
              {t("dashboard.pendingActions")}
              <PendingBadge>{pending.total}</PendingBadge>
            </SectionTitle>
            <ActionLink to={ROUTES.TEAM}>{t("dashboard.viewAll")}</ActionLink>
          </SectionHeader>
          <PendingList>
            {pending.leave > 0 && (
              <PendingItem>
                <Badge label={t("team.approval.leave")} variant="info" />
                <PendingText>{pending.leave} {t("dashboard.leaveRequests")}</PendingText>
              </PendingItem>
            )}
            {pending.flag > 0 && (
              <PendingItem>
                <Badge label={t("team.approval.flag")} variant="warning" />
                <PendingText>{pending.flag} {t("dashboard.flagsPending")}</PendingText>
              </PendingItem>
            )}
            {pending.bank > 0 && (
              <PendingItem>
                <Badge label={t("team.approval.bank")} variant="success" />
                <PendingText>{pending.bank} {t("dashboard.bankPending")}</PendingText>
              </PendingItem>
            )}
          </PendingList>
        </Card>
      )}
    </>
  );
};

/* ── Admin: Organization Summary ── */

const AdminSection = () => {
  const { t } = useTranslation();
  const { data: allEmployees } = useEmployees();

  const activeCount = allEmployees?.filter((e: Employee) => e.status === EmployeeStatuses.ACTIVE).length ?? 0;

  return (
    <Card>
      <SectionTitle>{t("dashboard.orgSummary")}</SectionTitle>
      <OrgStatsRow>
        <OrgStat>
          <OrgStatValue>{activeCount}</OrgStatValue>
          <OrgStatLabel>{t("dashboard.totalEmployees")}</OrgStatLabel>
        </OrgStat>
      </OrgStatsRow>
    </Card>
  );
};

/* ── Styled Components ── */

const ClockSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space.sm};
  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const BalanceValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.accent};
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  flex-wrap: wrap;
`;

const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  min-height: 44px;
  transition: all ${({ theme }) => theme.transition};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.space.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const HolidayRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.space.sm} 0;
`;

/* Team Section */

const TeamCountsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  justify-content: center;
  padding: ${({ theme }) => theme.space.md} 0;
`;

const TeamCount = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const CountValue = styled.span<{ $color: ThemeColorKey }>`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme, $color }) => theme.colors[$color]};
`;

const CountLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TeamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.space.sm};
`;

const TeamMemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} 0;
`;

const MemberAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textInverse};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
`;

const MemberName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  flex: 1;
`;

const PendingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding: 0 6px;
`;

const PendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const PendingItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const PendingText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* Admin Section */

const OrgStatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  justify-content: center;
  padding: ${({ theme }) => theme.space.md} 0;
`;

const OrgStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const OrgStatValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.accent};
`;

const OrgStatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
