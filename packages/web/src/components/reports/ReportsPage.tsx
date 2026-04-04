import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { nowIso } from "@hr-attendance-app/types";
import { Card, PageLayout, FormField, FormLayout, ButtonAccent, Badge, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useReports, useSubmitReport } from "../../hooks/queries/useReports";
import { formatDate, formatDateTime, isoToLocalDate } from "../../utils/date";

export const ReportsPage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [reportText, setReportText] = useState("");
  const [filterDate, setFilterDate] = useState(() => isoToLocalDate(nowIso()));

  const { data: reports, isLoading } = useReports(filterDate);
  const submitReport = useSubmitReport();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    submitReport.mutate(
      { text: reportText, date: filterDate },
      {
        onSuccess: () => {
          setReportText("");
          toast.show(t("reports.submitted"), "success");
        },
      },
    );
  };

  return (
    <PageLayout>
      {/* Submit Form */}
      <Card>
        <FormLayout onSubmit={handleSubmit}>
          <FormField>
            <label htmlFor="report-text">{t("reports.dailyReport")}</label>
            <textarea
              id="report-text"
              rows={5}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={t("reports.placeholder")}
            />
          </FormField>
          <FormField>
            <label htmlFor="report-date">{t("reports.date")}</label>
            <input type="date" id="report-date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </FormField>
          <ButtonAccent type="submit" disabled={submitReport.isPending}>
            {submitReport.isPending ? t("common.submitting") : t("reports.submit")}
          </ButtonAccent>
        </FormLayout>
      </Card>

      {/* History */}
      <Card>
        <HistoryHeader>{t("reports.history")}</HistoryHeader>
        {isLoading && <LoadingSpinner />}
        {!isLoading && !reports?.length && (
          <EmptyState message={t("reports.noReports")} />
        )}
        {!isLoading && !!reports?.length && (
          <ReportList>
            {reports.map((r) => (
              <ReportItem key={r.id}>
                <ReportMeta>
                  <span>{formatDate(r.date)}</span>
                  {r.version > 1 && <Badge label={`v${r.version}`} variant="info" />}
                  <TimeStamp>{formatDateTime(r.createdAt)}</TimeStamp>
                </ReportMeta>
                <ReportBody>{r.yesterday}</ReportBody>
                {r.references.length > 0 ? (
                  <RefRow>
                    {r.references.map((ref, i) => (
                      <Badge key={i} label={`${ref.type}: ${ref.id}`} variant="info" />
                    ))}
                  </RefRow>
                ) : (
                  <NoRefBadge><Badge label={t("reports.noReferences")} variant="warning" /></NoRefBadge>
                )}
              </ReportItem>
            ))}
          </ReportList>
        )}
      </Card>
    </PageLayout>
  );
};

const HistoryHeader = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const ReportList = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.md};
`;

const ReportItem = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const ReportMeta = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.sm}; flex-wrap: wrap;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const TimeStamp = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
`;

const ReportBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal}; white-space: pre-wrap;
`;

const RefRow = styled.div`
  display: flex; gap: ${({ theme }) => theme.space.xs}; flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.space.sm};
`;

const NoRefBadge = styled.div`
  margin-top: ${({ theme }) => theme.space.sm};
`;
