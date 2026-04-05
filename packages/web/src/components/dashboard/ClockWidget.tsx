import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { css, keyframes } from "styled-components";
import type { AttendanceAction, AttendanceState, AttendanceEvent } from "@hr-attendance-app/types";
import { AttendanceStates, AttendanceActions, HOURS, ATTENDANCE, nowMs } from "@hr-attendance-app/types";
import { ButtonAccent, ButtonDanger, ButtonSecondary } from "../../theme/primitives";
import { ATTENDANCE_STATUS_CONFIG } from "../../utils/attendance-status";
import type { ThemeColorKey } from "../../utils/attendance-status";
import { formatElapsed, formatTime } from "../../utils/date";

interface ClockWidgetProps {
  readonly status: AttendanceState;
  readonly hoursToday: number;
  readonly breakMinutesToday: number;
  readonly lastEventTimestamp: string | null;
  readonly todayEvents?: readonly AttendanceEvent[];
  readonly onAction: (action: AttendanceAction) => void;
  readonly loading?: boolean;
}

export const ClockWidget = ({
  status,
  hoursToday,
  breakMinutesToday,
  lastEventTimestamp,
  todayEvents = [],
  onAction,
  loading,
}: ClockWidgetProps) => {
  const { t } = useTranslation();
  const config = ATTENDANCE_STATUS_CONFIG[status];
  const isActive = status !== AttendanceStates.IDLE;

  // Elapsed timer — counts from lastEventTimestamp when active
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isActive || !lastEventTimestamp) {
      setElapsed(0);
      return;
    }
    const startMs = new Date(lastEventTimestamp).getTime();
    const tick = () => {
      const delta = Math.max(0, Math.floor((nowMs() - startMs) / 1000));
      setElapsed(delta);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, lastEventTimestamp]);

  // Cooldown: disable buttons for IDEMPOTENCY_WINDOW after last event
  const [cooldownSec, setCooldownSec] = useState(0);
  useEffect(() => {
    if (!lastEventTimestamp) return;
    const windowSec = ATTENDANCE.IDEMPOTENCY_WINDOW_MS / 1000;
    const tick = () => {
      const elapsedSec = (nowMs() - new Date(lastEventTimestamp).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(windowSec - elapsedSec));
      setCooldownSec(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastEventTimestamp]);

  const isCoolingDown = cooldownSec > 0;

  const handleAction = useCallback(
    (action: AttendanceAction) => {
      if (!loading && !isCoolingDown) onAction(action);
    },
    [loading, isCoolingDown, onAction],
  );

  const progressPct = HOURS.DAILY_MINIMUM > 0
    ? Math.min(100, Math.round((hoursToday / HOURS.DAILY_MINIMUM) * 100))
    : 0;

  const workHours = Math.floor(hoursToday);
  const workMins = Math.round((hoursToday - workHours) * 60);

  return (
    <Wrapper data-testid="clock-widget" $status={status}>
      {/* Status indicator */}
      <StatusRow>
        <StatusDot $color={config.color} $active={isActive} />
        <StatusLabel $color={config.color}>{t(config.labelKey)}</StatusLabel>
      </StatusRow>

      {/* Elapsed timer or total hours */}
      {isActive ? (
        <TimerSection>
          <Timer>{formatElapsed(elapsed)}</Timer>
        </TimerSection>
      ) : (
        <TimerSection>
          <HoursDisplay>{hoursToday.toFixed(1)}h</HoursDisplay>
        </TimerSection>
      )}

      {/* Work / Break stats */}
      <StatsRow>
        <StatItem>
          <StatValue>{workHours}h {workMins}m</StatValue>
          <StatLabel>{t("dashboard.totalWork")}</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{breakMinutesToday}m</StatValue>
          <StatLabel>{t("dashboard.totalBreak")}</StatLabel>
        </StatItem>
      </StatsRow>

      {/* Today's progress */}
      <ProgressSection>
        <ProgressHeader>
          <ProgressLabel>{t("dashboard.todayProgress")}</ProgressLabel>
          <ProgressValue>{hoursToday.toFixed(1)} / {HOURS.DAILY_MINIMUM}h</ProgressValue>
        </ProgressHeader>
        <ProgressTrack>
          <ProgressFill $pct={progressPct} $status={status} />
        </ProgressTrack>
      </ProgressSection>

      {/* Action buttons */}
      <Actions>
        {isCoolingDown && (
          <CooldownLabel>{t("dashboard.cooldown", { seconds: cooldownSec })}</CooldownLabel>
        )}
        {status === AttendanceStates.IDLE && (
          <PrimaryAction
            onClick={() => handleAction(AttendanceActions.CLOCK_IN)}
            disabled={loading || isCoolingDown}
          >
            {t("dashboard.clockIn")}
          </PrimaryAction>
        )}
        {status === AttendanceStates.CLOCKED_IN && (
          <>
            <DangerAction
              onClick={() => handleAction(AttendanceActions.CLOCK_OUT)}
              disabled={loading || isCoolingDown}
            >
              {t("dashboard.clockOut")}
            </DangerAction>
            <SecondaryAction
              onClick={() => handleAction(AttendanceActions.BREAK_START)}
              disabled={loading || isCoolingDown}
            >
              {t("dashboard.break")}
            </SecondaryAction>
          </>
        )}
        {status === AttendanceStates.ON_BREAK && (
          <PrimaryAction
            onClick={() => handleAction(AttendanceActions.BREAK_END)}
            disabled={loading || isCoolingDown}
          >
            {t("dashboard.back")}
          </PrimaryAction>
        )}
      </Actions>

      {/* Today's session timeline */}
      {todayEvents.length > 0 && (
        <Timeline>
          <TimelineTitle>{t("dashboard.todaySessions")}</TimelineTitle>
          {todayEvents.map((evt) => (
            <TimelineEntry key={evt.id} $action={evt.action}>
              <TimelineDot $action={evt.action} />
              <TimelineTime>{formatTime(evt.timestamp)}</TimelineTime>
              <TimelineLabel>{t(`attendance.action.${evt.action}`)}</TimelineLabel>
            </TimelineEntry>
          ))}
        </Timeline>
      )}
    </Wrapper>
  );
};

/* ── Animations ── */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/* ── Styled Components ── */

const Wrapper = styled.div<{ $status: AttendanceState }>`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.lg};
  box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 100%;
  align-self: center;
  margin: 0 auto;
  gap: ${({ theme }) => theme.space.md};
  border-top: 3px solid ${({ theme, $status }) =>
    $status === AttendanceStates.CLOCKED_IN ? theme.colors.accent :
    $status === AttendanceStates.ON_BREAK ? theme.colors.warning :
    theme.colors.borderLight};
  transition: border-color ${({ theme }) => theme.transition};
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const StatusDot = styled.div<{ $color: ThemeColorKey; $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $color }) => theme.colors[$color]};
  ${({ $active }) => $active && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`;

const StatusLabel = styled.span<{ $color: ThemeColorKey }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $color }) => theme.colors[$color]};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const TimerSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
`;

const Timer = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: 0.02em;
`;

const HoursDisplay = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 100%;
  max-width: 280px;
  justify-content: center;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const StatValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text};
`;

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 28px;
  background: ${({ theme }) => theme.colors.border};
`;

const ProgressSection = styled.div`
  width: 100%;
  max-width: 280px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const ProgressLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $status: AttendanceState }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme, $status }) =>
    $status === AttendanceStates.ON_BREAK ? theme.colors.warning : theme.colors.accent};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 300ms ease-out;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 280px;
`;

const CooldownLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.warning};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: center;
  width: 100%;
`;

const actionBase = css`
  flex: 1;
  min-width: 120px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  min-height: 48px;
`;

const PrimaryAction = styled(ButtonAccent)`${actionBase}`;
const DangerAction = styled(ButtonDanger)`${actionBase}`;
const SecondaryAction = styled(ButtonSecondary)`${actionBase}`;

/* ── Timeline ── */

const ACTION_COLORS: Record<string, ThemeColorKey> = {
  [AttendanceActions.CLOCK_IN]: "success",
  [AttendanceActions.CLOCK_OUT]: "error",
  [AttendanceActions.BREAK_START]: "warning",
  [AttendanceActions.BREAK_END]: "accent",
};

const Timeline = styled.div`
  width: 100%;
  max-width: 280px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.space.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const TimelineTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const TimelineEntry = styled.div<{ $action: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: 2px 0;
`;

const TimelineDot = styled.div<{ $action: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $action }) =>
    theme.colors[ACTION_COLORS[$action] as keyof typeof theme.colors] ?? theme.colors.textMuted};
  flex-shrink: 0;
`;

const TimelineTime = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 40px;
`;

const TimelineLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
