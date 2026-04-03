import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";
import { AttendanceLockTab } from "./AttendanceLockTab";

const ADMIN_TAB_IDS = ["onboarding", "offboarding", "policies", "roles", "holidays", "locks"] as const;
type AdminTab = (typeof ADMIN_TAB_IDS)[number];

const TabNav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: ${({ theme }) => theme.space.xs};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.background};
  color: ${({ theme, $active }) => $active ? theme.colors.background : theme.colors.text};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: all ${({ theme }) => theme.transition};
`;

export function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>("onboarding");

  return (
    <PageLayout>
      <TabNav>
        {ADMIN_TAB_IDS.map((id) => (
          <Tab
            key={id}
            $active={activeTab === id}
            onClick={() => setActiveTab(id)}
          >
            {t(`admin.${id}`)}
          </Tab>
        ))}
      </TabNav>

      <Card>
        <SectionTitle>{t(`admin.${activeTab}`)}</SectionTitle>
        {activeTab === "locks" ? (
          <AttendanceLockTab />
        ) : (
          <TextMuted>{t(`admin.${activeTab}Desc`)}</TextMuted>
        )}
      </Card>
    </PageLayout>
  );
}
