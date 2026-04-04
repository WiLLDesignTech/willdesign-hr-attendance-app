import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AttendanceStates, ROUTES, HOURS, Regions, currentYear } from "@hr-attendance-app/types";
import { ClockWidget } from "./ClockWidget";
import { Card, PageLayout, ProgressBar, Badge } from "../ui";
import { useAttendanceState, useClockAction } from "../../hooks/queries/useAttendance";
import { useLeaveBalance } from "../../hooks/queries/useLeave";
import { useHolidays } from "../../hooks/queries";
import { useIsManager } from "../../hooks/useRole";
import { formatDate } from "../../utils/date";


export function DashboardPage() {
  const { t } = useTranslation();
  const { data: attState, isLoading: attLoading } = useAttendanceState();
  const clockAction = useClockAction();
  const { data: balance } = useLeaveBalance();
  const { data: holidays } = useHolidays(Regions.JP, currentYear());
  const isManager = useIsManager();

  const status = attState?.state ?? AttendanceStates.IDLE;

  // Elapsed timer when clocked in
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (status !== AttendanceStates.CLOCKED_IN) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatElapsed = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  const upcomingHolidays = holidays?.slice(0, 3) ?? [];

  return (
    <PageLayout>
      {/* Clock Widget — primary action */}
      <ClockSection>
        <ClockWidget
          status={status}
          hoursToday={0}
          onAction={(action) => clockAction.mutate(action)}
          loading={clockAction.isPending || attLoading}
        />
        {status === AttendanceStates.CLOCKED_IN && (
          <ElapsedTimer>{formatElapsed(elapsed)}</ElapsedTimer>
        )}
      </ClockSection>

      {/* Stats Row */}
      <StatsGrid>
        <StatCard>
          <StatLabel>{t("dashboard.hoursToday")}</StatLabel>
          <ProgressBar value={0} max={HOURS.DAILY_MINIMUM} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursWeek")}</StatLabel>
          <ProgressBar value={0} max={HOURS.WEEKLY_MINIMUM} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursMonth")}</StatLabel>
          <ProgressBar value={0} max={HOURS.MONTHLY_FULL_TIME} variant="accent" />
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.leaveBalance")}</StatLabel>
          <BalanceValue>{balance?.paidLeaveRemaining ?? 0} {t("dashboard.days")}</BalanceValue>
        </StatCard>
      </StatsGrid>

      {/* Quick Actions */}
      <QuickActions>
        <ActionLink to={ROUTES.LEAVE}>{t("dashboard.newLeave")}</ActionLink>
        <ActionLink to={ROUTES.REPORTS}>{t("dashboard.viewReports")}</ActionLink>
        <ActionLink to={ROUTES.PAYROLL}>{t("dashboard.viewPayroll")}</ActionLink>
        {isManager && <ActionLink to={ROUTES.TEAM}>{t("dashboard.viewTeam")}</ActionLink>}
      </QuickActions>

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <Card>
          <HolidayTitle>{t("dashboard.upcomingHolidays")}</HolidayTitle>
          {upcomingHolidays.map((h) => (
            <HolidayRow key={`${h.region}-${h.date}`}>
              <span>{formatDate(h.date)}</span>
              <Badge label={h.name} variant="info" />
            </HolidayRow>
          ))}
        </Card>
      )}
    </PageLayout>
  );
}

const ClockSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const ElapsedTimer = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.accent};
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

const HolidayTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
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
