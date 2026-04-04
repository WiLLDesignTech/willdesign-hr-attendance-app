import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { nowIso } from "@hr-attendance-app/types";
import { Card, PageLayout, FormField, Badge } from "../ui";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { usePayroll } from "../../hooks/queries/usePayroll";
import { formatAmount } from "../../utils/currency";
import { formatDate, isoToLocalMonth } from "../../utils/date";

export const PayrollPage = () => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(isoToLocalMonth(nowIso()));
  const { data: payroll, isLoading } = usePayroll(month);

  return (
    <PageLayout>
      <Card>
        <FormField>
          <label htmlFor="payroll-month">{t("payroll.month")}</label>
          <input type="month" id="payroll-month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </FormField>
      </Card>

      <BreakdownCard>
        {isLoading && <LoadingSpinner />}
        {!isLoading && !payroll && (
          <p>{t("common.noData")}</p>
        )}
        {!isLoading && payroll && (
          <>
            <LineItem>
              <LineLabel>{t("payroll.baseSalary")}</LineLabel>
              <LineAmount>{formatAmount(payroll.baseSalary, payroll.currency)}</LineAmount>
            </LineItem>

            {payroll.proRataAdjustment !== 0 && (
              <LineItem>
                <LineLabel>{t("payroll.proRata")}</LineLabel>
                <LineAmount>{formatAmount(payroll.proRataAdjustment, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            {payroll.overtimePay > 0 && (
              <LineItem>
                <LineLabel>{t("payroll.overtime")}</LineLabel>
                <LineAmount>{formatAmount(payroll.overtimePay, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            {payroll.allowances.map((a) => (
              <LineItem key={a.type}>
                <LineLabel>{a.name}</LineLabel>
                <LineAmount>{formatAmount(a.amount, a.currency)}</LineAmount>
              </LineItem>
            ))}

            {payroll.bonus > 0 && (
              <LineItem>
                <LineLabel>{t("payroll.bonus")}</LineLabel>
                <LineAmount>{formatAmount(payroll.bonus, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            {payroll.commission > 0 && (
              <LineItem>
                <LineLabel>{t("payroll.commission")}</LineLabel>
                <LineAmount>{formatAmount(payroll.commission, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            {payroll.deficitDeduction > 0 && (
              <LineItem $danger>
                <LineLabel>{t("payroll.deductions")}</LineLabel>
                <LineAmount>-{formatAmount(payroll.deficitDeduction, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            {payroll.blendingDetails && (
              <BlendingSection>
                <BlendingTitle>{t("payroll.blending")}</BlendingTitle>
                <BlendingDetail>
                  {formatAmount(payroll.blendingDetails.oldSalary, payroll.currency)} × {payroll.blendingDetails.oldDays}d +{" "}
                  {formatAmount(payroll.blendingDetails.newSalary, payroll.currency)} × {payroll.blendingDetails.newDays}d
                </BlendingDetail>
              </BlendingSection>
            )}

            {payroll.transferFees > 0 && (
              <LineItem>
                <LineLabel>{t("payroll.transferFees")}</LineLabel>
                <LineAmount>{formatAmount(payroll.transferFees, payroll.currency)}</LineAmount>
              </LineItem>
            )}

            <Divider />

            <TotalLine>
              <LineLabel>{t("payroll.netAmount")}</LineLabel>
              <TotalAmount>{formatAmount(payroll.netAmount, payroll.currency)}</TotalAmount>
            </TotalLine>

            {payroll.homeCurrencyEquivalent != null && (
              <ExchangeRow>
                <Badge label={`JPY ${formatAmount(payroll.homeCurrencyEquivalent, "JPY")}`} variant="info" />
                {payroll.exchangeRate && <ExchangeMeta>{t("payroll.rate")}: {payroll.exchangeRate}</ExchangeMeta>}
                {payroll.exchangeRateDate && <ExchangeMeta>{formatDate(payroll.exchangeRateDate)}</ExchangeMeta>}
              </ExchangeRow>
            )}
          </>
        )}
      </BreakdownCard>
    </PageLayout>
  );
};

const BreakdownCard = styled(Card)`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.xs};
`;

const LineItem = styled.div<{ $danger?: boolean }>`
  display: flex; justify-content: space-between; align-items: center;
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme, $danger }) => $danger ? theme.colors.danger : theme.colors.text};
`;

const LineLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const LineAmount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums; font-family: ${({ theme }) => theme.fonts.mono};
`;

const Divider = styled.hr`
  border: none; border-top: 2px solid ${({ theme }) => theme.colors.text}; margin: ${({ theme }) => theme.space.sm} 0;
`;

const TotalLine = styled.div`
  display: flex; justify-content: space-between; align-items: center;
`;

const TotalAmount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading}; font-variant-numeric: tabular-nums;
`;

const BlendingSection = styled.div`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.infoLight}; border-radius: ${({ theme }) => theme.radii.sm};
`;

const BlendingTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.info}; margin-bottom: ${({ theme }) => theme.space.xs};
`;

const BlendingDetail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-family: ${({ theme }) => theme.fonts.mono};
`;

const ExchangeRow = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm}; margin-top: ${({ theme }) => theme.space.sm};
`;

const ExchangeMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
`;
