import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AttendanceStates, nowIso } from "@hr-attendance-app/types";
import { ClockWidget } from "../dashboard/ClockWidget";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAttendanceState, useAttendanceEvents, useClockAction } from "../../hooks/queries/useAttendance";
import { formatDateTime, isoToLocalDate } from "../../utils/date";

const EventList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const EventItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.xs} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.875rem;
  &:last-child { border-bottom: none; }
`;

export function AttendancePage() {
  const { t } = useTranslation();
  const [selectedDate] = useState(() => isoToLocalDate(nowIso()));
  const { data: attState, isLoading: stateLoading } = useAttendanceState();
  const { data: events, isLoading: eventsLoading } = useAttendanceEvents(selectedDate);
  const clockAction = useClockAction();

  if (stateLoading) return <LoadingSpinner />;

  const status = attState?.state ?? AttendanceStates.IDLE;

  return (
    <PageLayout>
      <Card data-testid="web-clock">
        <SectionTitle>{t("nav.attendance")}</SectionTitle>
        <ClockWidget
          status={status}
          hoursToday={0}
          onAction={(action) => clockAction.mutate(action)}
          loading={clockAction.isPending}
        />
      </Card>

      <Card>
        <SectionTitle>{t("attendance.history")}</SectionTitle>
        {eventsLoading ? (
          <LoadingSpinner />
        ) : !events?.length ? (
          <TextMuted>{t("attendance.noRecords")}</TextMuted>
        ) : (
          <EventList>
            {events.map((e) => (
              <EventItem key={e.id}>
                <span>{t(`attendance.action.${e.action}`)}</span>
                <span>{formatDateTime(e.timestamp)}</span>
              </EventItem>
            ))}
          </EventList>
        )}
      </Card>

      <Card>
        <SectionTitle>{t("attendance.teamCalendar")}</SectionTitle>
        <TextMuted>{t("attendance.noLeaves")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
