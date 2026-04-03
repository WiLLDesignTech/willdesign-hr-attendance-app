import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useTeamMembers } from "../../hooks/queries/useTeam";
import { useFlags } from "../../hooks/queries/useFlags";

const MemberList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MemberItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`;

const MemberName = styled.span`
  font-weight: 600;
`;

const MemberMeta = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function TeamPage() {
  const { t } = useTranslation();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: flags, isLoading: flagsLoading } = useFlags();

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("team.overview")}</SectionTitle>
        {membersLoading ? (
          <LoadingSpinner />
        ) : !members?.length ? (
          <TextMuted>{t("team.noMembers")}</TextMuted>
        ) : (
          <MemberList>
            {members.map((m) => (
              <MemberItem key={m.id}>
                <MemberName>{m.name}</MemberName>
                <MemberMeta>{t(`team.employmentType.${m.employmentType}`)} · {t(`team.region.${m.region}`)}</MemberMeta>
              </MemberItem>
            ))}
          </MemberList>
        )}
      </Card>

      <Card>
        <SectionTitle>{t("team.flags")}</SectionTitle>
        {flagsLoading ? (
          <LoadingSpinner />
        ) : !flags?.length ? (
          <TextMuted>{t("team.noFlags")}</TextMuted>
        ) : (
          <TextMuted>{flags.length} {t("team.flags").toLowerCase()}</TextMuted>
        )}
      </Card>

      <Card>
        <SectionTitle>{t("team.surplusBanking")}</SectionTitle>
        <TextMuted>{t("team.noSurplus")}</TextMuted>
      </Card>

      <Card>
        <SectionTitle>{t("team.missingReports")}</SectionTitle>
        <TextMuted>{t("team.allSubmitted")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
