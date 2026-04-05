import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AttendanceStates, isoToDateStr, dateToDateStr, nowIso } from "@hr-attendance-app/types";
import { ClockWidget } from "../dashboard/ClockWidget";
import { Card, PageLayout, Calendar, Badge, ProgressBar, Modal, FormField, ButtonAccent, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import {
  useAttendanceState, useAttendanceEvents, useAttendanceSummary,
  useClockAction, useEditAttendanceEvent,
} from "../../hooks/queries/useAttendance";
import { useAttendanceLocks } from "../../hooks/queries";
import { formatDateTime, isoToLocalDate } from "../../utils/date";


export const AttendancePage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(() => isoToLocalDate(nowIso()));
  const [editEvent, setEditEvent] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const currentMonth = selectedDate.slice(0, 7);

  const { data: attState } = useAttendanceState();
  const { data: summary } = useAttendanceSummary();
  const { data: events, isLoading: eventsLoading } = useAttendanceEvents(selectedDate);
  const clockAction = useClockAction();
  const editMutation = useEditAttendanceEvent();
  const { data: locks } = useAttendanceLocks(currentMonth);

  const status = attState?.state ?? AttendanceStates.IDLE;
  const isLocked = (locks?.length ?? 0) > 0;
  const hoursToday = summary?.hoursToday ?? 0;
  const hoursMonth = summary?.hoursMonth ?? 0;
  const breakMinutesToday = summary?.breakMinutesToday ?? 0;
  const requiredMonthly = summary?.requiredMonthly ?? 160;

  const eventDates = useMemo(() => {
    if (!events) return new Set<string>();
    return new Set(events.map((e) => isoToDateStr(e.timestamp)));
  }, [events]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(dateToDateStr(date));
  };

  const handleEditSubmit = () => {
    if (!editEvent || !editReason.trim()) return;
    editMutation.mutate(
      { eventId: editEvent, reason: editReason },
      {
        onSuccess: () => {
          toast.show(t("attendance.editSaved"), "success");
          setEditEvent(null);
          setEditReason("");
        },
        onError: () => {
          toast.show(t("common.error"), "danger");
        },
      },
    );
  };

  return (
    <PageLayout>
      {/* Clock Widget */}
      <Card>
        <ClockWidget
          status={status}
          hoursToday={hoursToday}
          breakMinutesToday={breakMinutesToday}
          lastEventTimestamp={attState?.lastEventTimestamp ?? null}
          onAction={(action) => clockAction.mutate(action, {
            onError: (err) => toast.show(err instanceof Error ? err.message : t("common.error"), "danger"),
          })}
          loading={clockAction.isPending}
        />
      </Card>

      {/* Monthly Calendar */}
      <Card>
        <CalendarHeader>
          <h3>{t("attendance.calendar")}</h3>
          {isLocked && <Badge label={t("attendance.locked")} variant="danger" />}
        </CalendarHeader>
        <Calendar
          selectedDate={new Date(selectedDate)}
          onDateSelect={handleDateSelect}
          highlightedDates={eventDates}
        />
        <HoursSummary>
          <ProgressBar value={hoursMonth} max={requiredMonthly} variant="accent" />
        </HoursSummary>
      </Card>

      {/* Day Detail */}
      <Card>
        <DayHeader>
          <h3>{t("attendance.dayDetail", { date: selectedDate })}</h3>
        </DayHeader>
        {eventsLoading ? (
          <p>{t("common.loading")}</p>
        ) : !events?.length ? (
          <EmptyState message={t("attendance.noRecords")} />
        ) : (
          <EventTimeline>
            {events.map((e) => (
              <TimelineItem key={e.id}>
                <TimelineTime>{formatDateTime(e.timestamp)}</TimelineTime>
                <TimelineAction>
                  <Badge label={t(`attendance.action.${e.action}`)} variant={e.action.includes("CLOCK_IN") ? "success" : "info"} />
                  <SourceBadge>{e.source}</SourceBadge>
                </TimelineAction>
                {!isLocked && (
                  <EditButton onClick={() => { setEditEvent(e.id); setEditReason(""); }}>
                    {t("attendance.edit")}
                  </EditButton>
                )}
              </TimelineItem>
            ))}
          </EventTimeline>
        )}
        {isLocked && <LockNotice>{t("attendance.lockedNotice")}</LockNotice>}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editEvent}
        onClose={() => setEditEvent(null)}
        title={t("attendance.editEvent")}
      >
        <EditForm>
          <FormField>
            <label htmlFor="edit-reason">{t("attendance.editReason")}</label>
            <textarea
              id="edit-reason"
              rows={3}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
          </FormField>
          <ButtonAccent
            onClick={handleEditSubmit}
            disabled={!editReason.trim() || editMutation.isPending}
          >
            {editMutation.isPending ? t("common.submitting") : t("common.submit")}
          </ButtonAccent>
        </EditForm>
      </Modal>
    </PageLayout>
  );
};

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space.md};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

const HoursSummary = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
  padding-top: ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const DayHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.space.md};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

const EventTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const TimelineItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm};
  border-left: 2px solid ${({ theme }) => theme.colors.accent};
  padding-left: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.space.xs};
  }
`;

const TimelineTime = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 140px;
`;

const TimelineAction = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  flex: 1;
`;

const SourceBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const EditButton = styled.button`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.background};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  min-height: 44px;
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const LockNotice = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;
