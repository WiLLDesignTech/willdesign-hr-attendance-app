import { useState } from "react";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";

const ADMIN_TABS = [
  { id: "onboarding", label: "Onboarding" },
  { id: "offboarding", label: "Offboarding" },
  { id: "policies", label: "Policies" },
  { id: "roles", label: "Roles" },
  { id: "holidays", label: "Holidays" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["id"];

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
  const [activeTab, setActiveTab] = useState<AdminTab>("onboarding");

  return (
    <PageLayout>
      <TabNav>
        {ADMIN_TABS.map((tab) => (
          <Tab
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabNav>

      <Card>
        {activeTab === "onboarding" && <OnboardingPanel />}
        {activeTab === "offboarding" && <OffboardingPanel />}
        {activeTab === "policies" && <PoliciesPanel />}
        {activeTab === "roles" && <RolesPanel />}
        {activeTab === "holidays" && <HolidaysPanel />}
      </Card>
    </PageLayout>
  );
}

function OnboardingPanel() {
  return (
    <div>
      <SectionTitle>Onboarding</SectionTitle>
      <TextMuted>Create a new employee record</TextMuted>
    </div>
  );
}

function OffboardingPanel() {
  return (
    <div>
      <SectionTitle>Offboarding</SectionTitle>
      <TextMuted>Process employee exit</TextMuted>
    </div>
  );
}

function PoliciesPanel() {
  return (
    <div>
      <SectionTitle>Policies</SectionTitle>
      <TextMuted>Manage policy configurations</TextMuted>
    </div>
  );
}

function RolesPanel() {
  return (
    <div>
      <SectionTitle>Roles</SectionTitle>
      <TextMuted>Manage custom roles and permissions</TextMuted>
    </div>
  );
}

function HolidaysPanel() {
  return (
    <div>
      <SectionTitle>Holidays</SectionTitle>
      <TextMuted>Manage regional holiday calendars</TextMuted>
    </div>
  );
}
