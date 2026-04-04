import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Badge } from "../ui";
import { nowMs, CRON } from "@hr-attendance-app/types";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ProbationBadgeProps {
  readonly probationEndDate: string | null | undefined;
  readonly showAlert?: boolean;
}

export function ProbationBadge({ probationEndDate, showAlert = false }: ProbationBadgeProps) {
  const { t } = useTranslation();

  if (!probationEndDate) return null;

  const endMs = new Date(probationEndDate).getTime();
  const daysRemaining = Math.max(0, Math.ceil((endMs - nowMs()) / MS_PER_DAY));
  const isExpiringSoon = daysRemaining <= CRON.PROBATION_ALERT_DAYS;

  if (daysRemaining === 0) return null;

  return (
    <>
      <Badge
        label={t("probation.daysRemaining", { days: daysRemaining })}
        variant={isExpiringSoon ? "warning" : "info"}
      />
      {showAlert && isExpiringSoon && (
        <AlertBanner>
          {t("probation.expiringAlert", { days: daysRemaining })}
        </AlertBanner>
      )}
    </>
  );
}

const AlertBanner = styled.div`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
  margin-top: ${({ theme }) => theme.space.xs};
`;
