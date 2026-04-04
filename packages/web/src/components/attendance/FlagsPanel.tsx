import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FlagLevels, FlagStatuses, FlagResolutions } from "@hr-attendance-app/types";
import { Card, Badge, ButtonAccent, EmptyState, FormField } from "../ui";
import { useToast } from "../ui/Toast";
import { useFlags, useResolveFlag } from "../../hooks/queries";
import { useIsManager } from "../../hooks/useRole";
import type { Flag } from "@hr-attendance-app/types";

export const FlagsPanel = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: flags, isLoading } = useFlags();
  const resolveFlag = useResolveFlag();
  const isManager = useIsManager();

  const grouped = useMemo(() => {
    if (!flags) return { daily: [], weekly: [], monthly: [] };
    return {
      daily: flags.filter((f) => f.level === FlagLevels.DAILY),
      weekly: flags.filter((f) => f.level === FlagLevels.WEEKLY),
      monthly: flags.filter((f) => f.level === FlagLevels.MONTHLY),
    };
  }, [flags]);

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;
  if (!flags?.length) return <EmptyState message={t("flags.none")} />;

  return (
    <FlagsContainer>
      {grouped.monthly.length > 0 && (
        <FlagGroup>
          <GroupTitle><Badge label={t("flags.monthly")} variant="danger" /></GroupTitle>
          {grouped.monthly.map((f) => (
            <FlagItem key={f.id} flag={f} isManager={isManager} onResolve={(flagId, resolution, bankOffset) => {
              resolveFlag.mutate(
                { flagId, resolution, bankOffsetHours: bankOffset },
                { onSuccess: () => toast.show(t("flags.resolved"), "success") },
              );
            }} />
          ))}
        </FlagGroup>
      )}
      {grouped.weekly.length > 0 && (
        <FlagGroup>
          <GroupTitle><Badge label={t("flags.weekly")} variant="warning" /></GroupTitle>
          {grouped.weekly.map((f) => <FlagItem key={f.id} flag={f} isManager={false} />)}
        </FlagGroup>
      )}
      {grouped.daily.length > 0 && (
        <FlagGroup>
          <GroupTitle><Badge label={t("flags.daily")} variant="info" /></GroupTitle>
          {grouped.daily.map((f) => <FlagItem key={f.id} flag={f} isManager={false} />)}
        </FlagGroup>
      )}
    </FlagsContainer>
  );
};

const FlagItem = ({
  flag,
  isManager,
  onResolve,
}: {
  readonly flag: Flag;
  readonly isManager: boolean;
  readonly onResolve?: (flagId: string, resolution: string, bankOffset?: number) => void;
}) => {
  const { t } = useTranslation();
  const [resolution, setResolution] = useState("");
  const [bankOffset, setBankOffset] = useState(0);
  const isPending = flag.status === FlagStatuses.PENDING;

  return (
    <FlagRow>
      <FlagInfo>
        <FlagPeriod>{flag.period}</FlagPeriod>
        <FlagDeficit>{flag.deficitHours}h {t("flags.deficit")}</FlagDeficit>
        <Badge
          label={isPending ? t("flags.pending") : t("flags.resolvedStatus")}
          variant={isPending ? "warning" : "success"}
        />
        {flag.resolution && <Badge label={flag.resolution} variant="info" />}
      </FlagInfo>
      {isPending && isManager && onResolve && (
        <ResolveSection>
          <FormField>
            <label htmlFor={`resolve-${flag.id}`}>{t("flags.resolution")}</label>
            <select id={`resolve-${flag.id}`} value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="">{t("common.select")}</option>
              <option value={FlagResolutions.NO_PENALTY}>{t("flags.noPenalty")}</option>
              <option value={FlagResolutions.DEDUCT_FULL}>{t("flags.deductFull")}</option>
              <option value={FlagResolutions.USE_BANK}>{t("flags.useBank")}</option>
              <option value={FlagResolutions.PARTIAL_BANK}>{t("flags.partialBank")}</option>
              <option value={FlagResolutions.DISCUSS}>{t("flags.discuss")}</option>
            </select>
          </FormField>
          {(resolution === FlagResolutions.USE_BANK || resolution === FlagResolutions.PARTIAL_BANK) && (
            <FormField>
              <label htmlFor={`bank-${flag.id}`}>{t("flags.bankOffset")}</label>
              <input
                id={`bank-${flag.id}`}
                type="number"
                min={0}
                value={bankOffset}
                onChange={(e) => setBankOffset(Number(e.target.value))}
              />
            </FormField>
          )}
          <ButtonAccent
            onClick={() => onResolve(flag.id, resolution, bankOffset || undefined)}
            disabled={!resolution}
          >
            {t("flags.resolve")}
          </ButtonAccent>
        </ResolveSection>
      )}
    </FlagRow>
  );
};

const FlagsContainer = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.md};
`;

const FlagGroup = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.sm};
`;

const GroupTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const FlagRow = styled(Card)`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.md};
`;

const FlagInfo = styled.div`
  display: flex; align-items: center; gap: ${({ theme }) => theme.space.sm}; flex-wrap: wrap;
`;

const FlagPeriod = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const FlagDeficit = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.danger};
`;

const ResolveSection = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.space.sm};
  padding-top: ${({ theme }) => theme.space.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;
