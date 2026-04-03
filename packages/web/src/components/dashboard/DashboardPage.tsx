import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AttendanceStates } from "@hr-attendance-app/types";
import { ClockWidget } from "./ClockWidget";
import { Card, PageLayout, TextMuted } from "../../theme/primitives";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAttendanceState, useClockAction } from "../../hooks/queries/useAttendance";
import { useLeaveBalance } from "../../hooks/queries/useLeave";

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space.sm};

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.space.md};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const PendingTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: attState, isLoading: attLoading } = useAttendanceState();
  const clockAction = useClockAction();
  const { data: balance } = useLeaveBalance();

  if (attLoading) return <LoadingSpinner />;

  const status = attState?.state ?? AttendanceStates.IDLE;

  return (
    <PageLayout>
      <ClockWidget
        status={status}
        hoursToday={0}
        onAction={(action) => clockAction.mutate(action)}
        loading={clockAction.isPending}
      />

      <StatsGrid>
        <StatCard>
          <StatLabel>{t("dashboard.hoursToday")}</StatLabel>
          <StatValue>0h</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursWeek")}</StatLabel>
          <StatValue>0h</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.hoursMonth")}</StatLabel>
          <StatValue>0h</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>{t("dashboard.leaveBalance")}</StatLabel>
          <StatValue>{balance?.paidLeaveRemaining ?? 0}</StatValue>
        </StatCard>
      </StatsGrid>

      <Card>
        <PendingTitle>{t("dashboard.pending")}</PendingTitle>
        <TextMuted>{t("dashboard.noPending")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
