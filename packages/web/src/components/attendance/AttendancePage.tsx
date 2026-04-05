import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AttendanceStates, AttendanceActions, isoToDateStr, isoToYearMonth, dateToDateStr, nowIso, todayDate } from "@hr-attendance-app/types";
import type { AttendanceEvent, AttendanceAction } from "@hr-attendance-app/types";

const ACTION_BADGE_VARIANT: Record<AttendanceAction, "success" | "danger" | "warning" | "info"> = {
  [AttendanceActions.CLOCK_IN]: "success",
  [AttendanceActions.CLOCK_OUT]: "danger",
  [AttendanceActions.BREAK_START]: "warning",
  [AttendanceActions.BREAK_END]: "info",
};
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
  const currentMonth = isoToYearMonth(selectedDate + "T00:00:00Z");

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
  const hoursWeek = summary?.hoursWeek ?? 0;
  const hoursMonth = summary?.hoursMonth ?? 0;
  const breakMinutesToday = summary?.breakMinutesToday ?? 0;
  const requiredDaily = summary?.requiredDaily ?? 8;
  const requiredWeekly = summary?.requiredWeekly ?? 40;
  const requiredMonthly = summary?.requiredMonthly ?? 160;

  const remainingDaily = Math.max(0, requiredDaily - hoursToday);
  const remainingWeekly = Math.max(0, requiredWeekly - hoursWeek);
  const remainingMonthly = Math.max(0, requiredMonthly - hoursMonth);
  const surplusDaily = Math.max(0, hoursToday - requiredDaily);
  const surplusWeekly = Math.max(0, hoursWeek - requiredWeekly);
  const surplusMonthly = Math.max(0, hoursMonth - requiredMonthly);

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

      <Card>
        <SummaryTitle>{t("attendance.hoursSummary")}</SummaryTitle>
        <SummaryGrid>
          {[
            { key: "daily", worked: hoursToday, required: requiredDaily, surplus: surplusDaily, remaining: remainingDaily },
            { key: "weekly", worked: hoursWeek, required: requiredWeekly, surplus: surplusWeekly, remaining: remainingWeekly },
            { key: "monthly", worked: hoursMonth, required: requiredMonthly, surplus: surplusMonthly, remaining: remainingMonthly },
          ].map((item) => (
            <SummaryCard key={item.key}>
              <SummaryPeriod>{t(`attendance.${item.key}`)}</SummaryPeriod>
              <ProgressBar value={item.worked} max={item.required} variant={item.surplus > 0 ? "success" : "accent"} />
              <SummaryRow>
                <SummaryDetail>
                  <SummaryDetailLabel>{t("attendance.worked")}</SummaryDetailLabel>
                  <SummaryDetailValue>{item.worked.toFixed(1)}h</SummaryDetailValue>
                </SummaryDetail>
                <SummaryDetail>
                  <SummaryDetailLabel>{t("attendance.required")}</SummaryDetailLabel>
                  <SummaryDetailValue>{item.required}h</SummaryDetailValue>
                </SummaryDetail>
                <SummaryDetail>
                  <SummaryDetailLabel>{item.surplus > 0 ? t("attendance.surplus") : t("attendance.remaining")}</SummaryDetailLabel>
                  <SummaryDetailValue $accent={item.surplus > 0}>
                    {item.surplus > 0 ? `+${item.surplus.toFixed(1)}h` : `${item.remaining.toFixed(1)}h`}
                  </SummaryDetailValue>
                </SummaryDetail>
              </SummaryRow>
            </SummaryCard>
          ))}
        </SummaryGrid>
      </Card>

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
                  <Badge label={t(`attendance.action.${e.action}`)} variant={ACTION_BADGE_VARIANT[e.action]} />
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

const SummaryTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const SummaryPeriod = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.xs};
`;

const SummaryDetail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const SummaryDetailLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
`;

const SummaryDetailValue = styled.span<{ $accent?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme, $accent }) => $accent ? theme.colors.success : theme.colors.text};
`;
