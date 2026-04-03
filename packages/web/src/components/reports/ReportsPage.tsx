import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";
import { nowIso } from "@willdesign-hr/types";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useReports, useSubmitReport } from "../../hooks/queries/useReports";
import { formatDate, isoToLocalDate } from "../../utils/date";

const ReportCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const ReportMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

export function ReportsPage() {
  const { t } = useTranslation();
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");

  const [todayDate] = useState(() => isoToLocalDate(nowIso()));
  const { data: reports, isLoading } = useReports(todayDate);
  const submitReport = useSubmitReport();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = `## Yesterday\n${yesterday}\n\n## Today\n${today}\n\n## Blockers\n${blockers}`;
    submitReport.mutate(
      { text, date: todayDate },
      { onSuccess: () => { setYesterday(""); setToday(""); setBlockers(""); } },
    );
  };

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("reports.dailyReport")}</SectionTitle>
        <FormLayout onSubmit={handleSubmit}>
          <FormField>
            <label htmlFor="report-yesterday">{t("reports.yesterday")}</label>
            <textarea
              id="report-yesterday"
              rows={3}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              placeholder={t("reports.yesterdayPlaceholder")}
            />
          </FormField>
          <FormField>
            <label htmlFor="report-today">{t("reports.today")}</label>
            <textarea
              id="report-today"
              rows={3}
              value={today}
              onChange={(e) => setToday(e.target.value)}
              placeholder={t("reports.todayPlaceholder")}
            />
          </FormField>
          <FormField>
            <label htmlFor="report-blockers">{t("reports.blockers")}</label>
            <textarea
              id="report-blockers"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder={t("reports.blockersPlaceholder")}
            />
          </FormField>
          <ButtonAccent type="submit" disabled={submitReport.isPending}>
            {submitReport.isPending ? t("common.loading") : t("reports.submit")}
          </ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>{t("reports.history")}</SectionTitle>
        {isLoading ? (
          <LoadingSpinner />
        ) : !reports?.length ? (
          <TextMuted>{t("reports.noReports")}</TextMuted>
        ) : (
          reports.map((r) => (
            <ReportCard key={r.id}>
              <ReportMeta>{formatDate(r.date)} · v{r.version}</ReportMeta>
              <div>{r.yesterday}</div>
            </ReportCard>
          ))
        )}
      </Card>
    </PageLayout>
  );
}
