import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, ButtonAccent, FormField } from "../ui";
import { useToast } from "../ui/Toast";
import { HOURS } from "@hr-attendance-app/types";

const MONTHS_IN_YEAR = 12;

const getMonthName = (monthIndex: number, year: number, locale: string): string => {
  return new Date(year, monthIndex).toLocaleString(locale, { month: "short" });
};

interface QuotaEditorProps {
  readonly employeeId: string;
  readonly year: number;
}

export const QuotaEditor = ({ year }: QuotaEditorProps) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const standardTotal = HOURS.MONTHLY_FULL_TIME * MONTHS_IN_YEAR;

  const [quotas, setQuotas] = useState<number[]>(
    () => Array.from({ length: MONTHS_IN_YEAR }, () => HOURS.MONTHLY_FULL_TIME),
  );
  const [acknowledged, setAcknowledged] = useState(false);

  const currentTotal = useMemo(() => quotas.reduce((s, h) => s + h, 0), [quotas]);
  const isUnderTarget = currentTotal < standardTotal;

  const handleChange = useCallback((index: number, value: number) => {
    setQuotas((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, value);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (isUnderTarget && !acknowledged) return;
    toast.show(t("quota.saved"), "success");
  }, [isUnderTarget, acknowledged, toast, t]);

  return (
    <Card>
      <QuotaGrid>
        {quotas.map((hours, i) => (
          <QuotaMonth key={i}>
            <MonthLabel>{getMonthName(i, year, i18n.language)} {year}</MonthLabel>
            <FormField>
              <input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => handleChange(i, Number(e.target.value))}
              />
            </FormField>
          </QuotaMonth>
        ))}
      </QuotaGrid>

      <TotalRow>
        <TotalLabel>{t("quota.total")}</TotalLabel>
        <TotalValue $warning={isUnderTarget}>
          {currentTotal}h / {standardTotal}h
        </TotalValue>
        {isUnderTarget && (
          <Badge label={t("quota.underTarget")} variant="warning" />
        )}
      </TotalRow>

      {isUnderTarget && (
        <AcknowledgeRow>
          <input
            type="checkbox"
            id="quota-ack"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <label htmlFor="quota-ack">{t("quota.acknowledgeReduction")}</label>
        </AcknowledgeRow>
      )}

      <SaveRow>
        <ButtonAccent onClick={handleSave} disabled={isUnderTarget && !acknowledged}>
          {t("common.submit")}
        </ButtonAccent>
      </SaveRow>
    </Card>
  );
};

const QuotaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const QuotaMonth = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const MonthLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
`;

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.md};
  padding-top: ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const TotalLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const TotalValue = styled.span<{ $warning: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme, $warning }) => $warning ? theme.colors.warning : theme.colors.text};
`;

const AcknowledgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  input { width: 18px; height: 18px; cursor: pointer; accent-color: ${({ theme }) => theme.colors.accent}; }
  label { cursor: pointer; }
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};
`;
