import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Tabs, Badge, ButtonAccent, EmptyState } from "../ui";
import { usePolicies, useUpdatePolicy } from "../../hooks/queries";
import { useToast } from "../ui/Toast";

const POLICY_GROUPS = [
  "jp-fulltime", "jp-contract", "jp-gyoumu-itaku", "jp-parttime",
  "jp-sales", "jp-intern", "np-fulltime", "np-paid-intern", "np-unpaid-intern",
] as const;

const POLICY_DOMAINS = [
  { key: "hours", labelKey: "admin.policy.hours" },
  { key: "leave", labelKey: "admin.policy.leave" },
  { key: "overtime", labelKey: "admin.policy.overtime" },
  { key: "compensation", labelKey: "admin.policy.compensation" },
  { key: "probation", labelKey: "admin.policy.probation" },
  { key: "flags", labelKey: "admin.policy.flags" },
  { key: "payment", labelKey: "admin.policy.payment" },
  { key: "report", labelKey: "admin.policy.report" },
  { key: "salaryStatement", labelKey: "admin.policy.salaryStatement" },
] as const;

export const PolicyTab = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string>(POLICY_GROUPS[0]);
  const [activeDomain, setActiveDomain] = useState<string>(POLICY_DOMAINS[0].key);

  const { data: policyData, isLoading } = usePolicies(selectedGroup);
  const updatePolicy = useUpdatePolicy();

  const effectivePolicy = policyData?.effective;
  const domainData = effectivePolicy
    ? (effectivePolicy as unknown as Record<string, Record<string, unknown>>)[activeDomain]
    : undefined;

  return (
    <PolicyLayout>
      <GroupList>
        <GroupHeader>{t("admin.policy.groups")}</GroupHeader>
        {POLICY_GROUPS.map((group) => (
          <GroupButton
            key={group}
            $active={selectedGroup === group}
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </GroupButton>
        ))}
      </GroupList>

      <PolicyContent>
        <Tabs
          tabs={POLICY_DOMAINS.map((d) => ({ key: d.key, label: t(d.labelKey) }))}
          activeKey={activeDomain}
          onChange={setActiveDomain}
        />

        {isLoading ? (
          <LoadingText>{t("common.loading")}</LoadingText>
        ) : !domainData ? (
          <EmptyState message={t("admin.policy.noData")} />
        ) : (
          <Card>
            <DomainGrid>
              {Object.entries(domainData as Record<string, unknown>).map(([key, value]) => (
                <DomainField key={key}>
                  <FieldLabel>{key}</FieldLabel>
                  <FieldValue>
                    {typeof value === "boolean" ? (
                      <Badge label={value ? t("common.yes") : t("common.no")} variant={value ? "success" : "info"} />
                    ) : Array.isArray(value) ? (
                      <span>{value.length} {t("admin.policy.items")}</span>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </FieldValue>
                </DomainField>
              ))}
            </DomainGrid>
            <SaveRow>
              <ButtonAccent
                disabled={updatePolicy.isPending}
                onClick={() => {
                  updatePolicy.mutate(
                    { groupName: selectedGroup, policy: {} },
                    {
                      onSuccess: () => toast.show(t("admin.policy.saved"), "success"),
                      onError: (err) => toast.show(err.message, "danger"),
                    },
                  );
                }}
              >
                {updatePolicy.isPending ? t("common.submitting") : t("common.submit")}
              </ButtonAccent>
            </SaveRow>
          </Card>
        )}
      </PolicyContent>
    </PolicyLayout>
  );
};

const PolicyLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const GroupList = styled.div`
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const GroupHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.space.sm};
`;

const GroupButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  background: ${({ theme, $active }) => $active ? theme.colors.selected : "transparent"};
  color: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $active }) => $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  text-align: left;
  min-height: 44px;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const PolicyContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: ${({ theme }) => theme.space.lg};
`;

const DomainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const DomainField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: capitalize;
`;

const FieldValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};
`;
