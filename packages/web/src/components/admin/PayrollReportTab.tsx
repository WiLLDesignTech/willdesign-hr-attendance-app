import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, EmptyState, FormField } from "../ui";
import { usePayrollReport } from "../../hooks/queries";
import { isoToYearMonth, nowIso } from "@hr-attendance-app/types";
import type { MonthlyPayrollReportEntry } from "@hr-attendance-app/types";
import { formatAmount } from "../../utils/currency";

export const PayrollReportTab = () => {
  const { t } = useTranslation();
  const [yearMonth, setYearMonth] = useState(() => isoToYearMonth(nowIso()));
  const { data: report, isLoading } = usePayrollReport(yearMonth);

  return (
    <>
      <MonthSelector>
        <FormField>
          <label htmlFor="report-month">{t("admin.payrollReport.month")}</label>
          <input id="report-month" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </FormField>
      </MonthSelector>

      {isLoading && <Card><p>{t("common.loading")}</p></Card>}

      {!isLoading && report && (
        <>
          <TotalsCard>
            <TotalsGrid>
              <TotalItem>
                <TotalValue>{report.totals.totalWorked.toFixed(1)}h</TotalValue>
                <TotalLabel>{t("admin.payrollReport.totalWorked")}</TotalLabel>
              </TotalItem>
              <TotalItem>
                <TotalValue>{report.totals.totalRequired.toFixed(1)}h</TotalValue>
                <TotalLabel>{t("admin.payrollReport.totalRequired")}</TotalLabel>
              </TotalItem>
              <TotalItem>
                <TotalValue>{report.totals.totalOvertime.toFixed(1)}h</TotalValue>
                <TotalLabel>{t("admin.payrollReport.totalOvertime")}</TotalLabel>
              </TotalItem>
              <TotalItem>
                <TotalValue>{formatAmount(report.totals.totalNet, "JPY")}</TotalValue>
                <TotalLabel>{t("admin.payrollReport.totalNet")}</TotalLabel>
              </TotalItem>
            </TotalsGrid>
          </TotalsCard>

          {report.entries.length === 0 && <EmptyState message={t("admin.payrollReport.noEntries")} />}

          {report.entries.length > 0 && (
            <Card>
              <EntryList>
                {report.entries.map((entry: MonthlyPayrollReportEntry) => (
                  <EntryRow key={entry.employeeId}>
                    <EntryMain>
                      <EntryName>{entry.employeeName}</EntryName>
                      <EntryMeta>
                        {entry.employmentType} · {entry.region}
                      </EntryMeta>
                    </EntryMain>
                    <EntryStats>
                      <Badge label={`${entry.workedHours.toFixed(1)}h / ${entry.requiredHours}h`} variant={entry.deficitHours > 0 ? "danger" : "success"} />
                      {entry.overtimeHours > 0 && <Badge label={`OT ${entry.overtimeHours.toFixed(1)}h`} variant="warning" />}
                      {entry.deficitHours > 0 && <Badge label={`-${entry.deficitHours.toFixed(1)}h`} variant="danger" />}
                      {entry.surplusHours > 0 && <Badge label={`+${entry.surplusHours.toFixed(1)}h`} variant="success" />}
                    </EntryStats>
                    <EntryPay>
                      {formatAmount(entry.payroll.netAmount, entry.payroll.currency)}
                    </EntryPay>
                  </EntryRow>
                ))}
              </EntryList>
            </Card>
          )}
        </>
      )}

      {!isLoading && !report && <EmptyState message={t("admin.payrollReport.noData")} />}
    </>
  );
};

const MonthSelector = styled.div`
  max-width: 200px;
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const TotalsCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const TotalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space.md};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TotalItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TotalValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.accent};
`;

const TotalLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const EntryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const EntryMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

const EntryName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const EntryMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EntryStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  flex-wrap: wrap;
  flex: 1;
`;

const EntryPay = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text};
`;
