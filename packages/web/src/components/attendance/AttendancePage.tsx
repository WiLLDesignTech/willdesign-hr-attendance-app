import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceAction, AttendanceState } from "@willdesign-hr/types";
import { AttendanceStates } from "@willdesign-hr/types";
import { ClockWidget } from "../dashboard/ClockWidget";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";

export function AttendancePage() {
  const { t } = useTranslation();
  const [status] = useState<AttendanceState>(AttendanceStates.IDLE);
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
      <Card data-testid="web-clock">
        <SectionTitle>{t("nav.attendance")}</SectionTitle>
        <ClockWidget
          status={status}
          hoursToday={0}
          onAction={handleAction}
          loading={loading}
        />
      </Card>

      <Card>
        <SectionTitle>Attendance History</SectionTitle>
        <TextMuted>No attendance records yet</TextMuted>
      </Card>

      <Card>
        <SectionTitle>Team Calendar</SectionTitle>
        <TextMuted>No scheduled leaves</TextMuted>
      </Card>
    </PageLayout>
  );
}
