import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { AttendanceAction, AttendanceState } from "@willdesign-hr/types";
import { AttendanceStates } from "@willdesign-hr/types";
import { ClockWidget } from "./ClockWidget";
import { Card, PageLayout, TextMuted } from "../../theme/primitives";

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
  const [status] = useState<AttendanceState>(AttendanceStates.IDLE);
  const [hoursToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleAction = (_action: AttendanceAction) => {
    setLoading(true);
    timerRef.current = setTimeout(() => setLoading(false), 500);
  };

  return (
    <PageLayout>
      <ClockWidget
        status={status}
        hoursToday={hoursToday}
        onAction={handleAction}
        loading={loading}
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
          <StatValue>0</StatValue>
        </StatCard>
      </StatsGrid>

      <Card>
        <PendingTitle>Pending</PendingTitle>
        <TextMuted>No pending actions</TextMuted>
      </Card>
    </PageLayout>
  );
}
