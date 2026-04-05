import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AttendanceStates, AttendanceActions, isoToDateStr, dateToDateStr, nowIso, todayDate } from "@hr-attendance-app/types";
import type { AttendanceEvent } from "@hr-attendance-app/types";
import { ClockWidget } from "../dashboard/ClockWidget";
import { Card, PageLayout, Calendar, Badge, ProgressBar, Modal, FormField, ButtonAccent, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import {
  useAttendanceState, useAttendanceEvents, useAttendanceSummary,
  useClockAction, useEditAttendanceEvent,
} from "../../hooks/queries/useAttendance";
import { useAttendanceLocks } from "../../hooks/queries";
import { formatDateTime, isoToLocalDate, isoToLocalDateTime, localDateTimeToIso } from "../../utils/date";
import { formatClockError } from "../../utils/attendance-status";

const ACTION_OPTIONS = [
  AttendanceActions.CLOCK_IN,
  AttendanceActions.CLOCK_OUT,
  AttendanceActions.BREAK_START,
  AttendanceActions.BREAK_END,
] as const;


export const AttendancePage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(() => isoToLocalDate(nowIso()));
  const [editEvent, setEditEvent] = useState<AttendanceEvent | null>(null);
  const [editTimestamp, setEditTimestamp] = useState("");
  const [editAction, setEditAction] = useState("");
  const [editReason, setEditReason] = useState("");
  const currentMonth = selectedDate.slice(0, 7);

  const { data: attState } = useAttendanceState();
  const { data: summary } = useAttendanceSummary();
  const today = todayDate();
  const { data: events, isLoading: eventsLoading } = useAttendanceEvents(selectedDate);
  const { data: todayEvents } = useAttendanceEvents(today);
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

  const openEditModal = useCallback((event: AttendanceEvent) => {
    setEditEvent(event);
    setEditTimestamp(isoToLocalDateTime(event.timestamp));
    setEditAction(event.action);
    setEditReason("");
  }, []);

  const handleEditSubmit = () => {
    if (!editEvent || !editReason.trim()) return;
    const timestampChanged = localDateTimeToIso(editTimestamp) !== editEvent.timestamp;
    const actionChanged = editAction !== editEvent.action;
    editMutation.mutate(
      {
        eventId: editEvent.id,
        reason: editReason,
        ...(timestampChanged ? { timestamp: localDateTimeToIso(editTimestamp) } : {}),
        ...(actionChanged ? { action: editAction } : {}),
      },
      {
        onSuccess: () => {
          toast.show(t("attendance.editSaved"), "success");
          setEditEvent(null);
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
      <ClockWidget
        status={status}
        hoursToday={hoursToday}
        breakMinutesToday={breakMinutesToday}
        lastEventTimestamp={attState?.lastEventTimestamp ?? null}
        todayEvents={todayEvents ?? []}
        onAction={(action) => clockAction.mutate(action, {
          onError: (err) => toast.show(formatClockError(err, t), "danger"),
        })}
        loading={clockAction.isPending}
      />

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
                  <EditButton onClick={() => openEditModal(e)}>
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
            <label htmlFor="edit-action">{t("attendance.editAction")}</label>
            <select
              id="edit-action"
              value={editAction}
              onChange={(e) => setEditAction(e.target.value)}
            >
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {t(`attendance.action.${action}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField>
            <label htmlFor="edit-timestamp">{t("attendance.editTimestamp")}</label>
            <input
              id="edit-timestamp"
              type="datetime-local"
              value={editTimestamp}
              onChange={(e) => setEditTimestamp(e.target.value)}
            />
          </FormField>
          <FormField>
            <label htmlFor="edit-reason">{t("attendance.editReason")}</label>
            <textarea
              id="edit-reason"
              rows={3}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder={t("attendance.editReasonPlaceholder")}
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
