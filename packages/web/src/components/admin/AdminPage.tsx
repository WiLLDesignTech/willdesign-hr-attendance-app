import { useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { PageLayout, SectionTitle as BaseSectionTitle } from "../ui";
import { OnboardingTab } from "./OnboardingTab";
import { OffboardingTab } from "./OffboardingTab";
import { PolicyTab } from "./PolicyTab";
import { RolesTab } from "./RolesTab";
import { HolidayTab } from "./HolidayTab";
import { AttendanceLockTab } from "./AttendanceLockTab";
import { EmployeesTab } from "./EmployeesTab";

type AdminSection = "onboarding" | "offboarding" | "employees" | "policies" | "roles" | "holidays" | "locks";

interface SectionConfig {
  readonly id: AdminSection;
  readonly labelKey: string;
  readonly descKey: string;
  readonly icon: string;
}

const SECTIONS: readonly SectionConfig[] = [
  { id: "onboarding", labelKey: "admin.onboarding", descKey: "admin.onboardingDesc", icon: "+" },
  { id: "offboarding", labelKey: "admin.offboarding", descKey: "admin.offboardingDesc", icon: "→" },
  { id: "employees", labelKey: "admin.employeesTitle", descKey: "admin.employeesDesc", icon: "⊡" },
  { id: "policies", labelKey: "admin.policies", descKey: "admin.policiesDesc", icon: "≡" },
  { id: "roles", labelKey: "admin.roles", descKey: "admin.rolesDesc", icon: "⊕" },
  { id: "holidays", labelKey: "admin.holidays", descKey: "admin.holidaysDesc", icon: "◆" },
  { id: "locks", labelKey: "admin.locks", descKey: "admin.locksDesc", icon: "⊠" },
];

const SECTION_CARD_MIN_HEIGHT = "100px";
const EMPTY_STATE_MIN_HEIGHT = "400px";

const getSectionContent = (section: AdminSection): ReactNode => {
  switch (section) {
    case "onboarding":
      return <OnboardingTab />;
    case "offboarding":
      return <OffboardingTab />;
    case "employees":
      return <EmployeesTab />;
    case "policies":
      return <PolicyTab />;
    case "roles":
      return <RolesTab />;
    case "holidays":
      return <HolidayTab />;
    case "locks":
      return <AttendanceLockTab />;
  }
};

export const AdminPage = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<AdminSection | null>(null);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id as AdminSection;
    setActiveSection(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveSection(null);
  }, []);

  const activeConfig = SECTIONS.find((s) => s.id === activeSection);

  return (
    <PageLayout>
      <AdminShell>
        {/* Desktop/Tablet: persistent sidebar nav */}
        <SideNav>
          <NavHeader>{t("nav.admin")}</NavHeader>
          {SECTIONS.map((section) => (
            <NavButton
              key={section.id}
              data-id={section.id}
              $active={activeSection === section.id}
              onClick={handleNavClick}
              aria-current={activeSection === section.id ? "page" : undefined}
            >
              <NavIcon>{section.icon}</NavIcon>
              <NavText>
                <NavLabel>{t(section.labelKey)}</NavLabel>
                <NavDesc>{t(section.descKey)}</NavDesc>
              </NavText>
            </NavButton>
          ))}
        </SideNav>

        {/* Content area */}
        <ContentArea>
          {/* Mobile: card grid when no section selected */}
          {!activeSection && (
            <MobileCardGrid>
              {SECTIONS.map((section) => (
                <SectionCard
                  key={section.id}
                  data-id={section.id}
                  onClick={handleNavClick}
                >
                  <CardIcon>{section.icon}</CardIcon>
                  <CardTitle>{t(section.labelKey)}</CardTitle>
                  <CardDesc>{t(section.descKey)}</CardDesc>
                </SectionCard>
              ))}
            </MobileCardGrid>
          )}

          {/* Desktop: empty state when no section selected */}
          {!activeSection && (
            <DesktopEmpty>
              <EmptyIcon>⊛</EmptyIcon>
              <EmptyText>{t("admin.selectSection")}</EmptyText>
            </DesktopEmpty>
          )}

          {/* Active section content */}
          {activeSection && activeConfig && (
            <SectionPanel>
              <SectionHeader>
                <BackButton onClick={handleBack} aria-label={t("common.back")}>
                  ←
                </BackButton>
                <SectionTitleGroup>
                  <SectionIcon>{activeConfig.icon}</SectionIcon>
                  <SectionTitle>{t(activeConfig.labelKey)}</SectionTitle>
                </SectionTitleGroup>
              </SectionHeader>
              <SectionContent>
                {getSectionContent(activeSection)}
              </SectionContent>
            </SectionPanel>
          )}
        </ContentArea>
      </AdminShell>
    </PageLayout>
  );
};

/* ─── Layout Shell ─── */

const AdminShell = styled.div`
  display: flex;
  gap: 0;
  min-height: 70vh;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

/* ─── Sidebar Navigation (Desktop/Tablet) ─── */

const SideNav = styled.nav`
  width: ${({ theme }) => theme.sidebar.width};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg} 0 0 ${({ theme }) => theme.radii.lg};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: ${({ theme }) => theme.sidebar.collapsedWidth};
    transition: width ${({ theme }) => theme.transition};

    &:hover {
      width: ${({ theme }) => theme.sidebar.width};
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const NavHeader = styled.div`
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    ${SideNav}:not(:hover) & {
      font-size: 0;
      padding: ${({ theme }) => theme.space.md};
    }
  }
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transition};
  min-height: 44px;
  border-left: 3px solid transparent;
  position: relative;

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.selected};
      border-left-color: ${theme.colors.accent};

      &::after {
        content: "";
        position: absolute;
        right: -1px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: ${theme.colors.background};
      }
    `}

  &:hover:not([aria-current="page"]) {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.focusRing};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.space.md};
    justify-content: center;

    ${SideNav}:hover & {
      justify-content: flex-start;
      padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
    }
  }
`;

const NavIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  width: ${({ theme }) => theme.space.lg};
  text-align: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.accent};
`;

const NavText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  overflow: hidden;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;

    ${SideNav}:hover & {
      display: flex;
    }
  }
`;

const NavLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NavDesc = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ─── Content Area ─── */

const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.lg};
  }
`;

/* ─── Mobile Card Grid ─── */

const MobileCardGrid = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.space.sm};
    padding: ${({ theme }) => theme.space.md};
  }
`;

const SectionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  text-align: left;
  min-height: ${SECTION_CARD_MIN_HEIGHT};
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.focusRing};
  }
`;

const CardIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.accent};
  line-height: 1;
`;

const CardTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const CardDesc = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

/* ─── Desktop Empty State ─── */

const DesktopEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: ${EMPTY_STATE_MIN_HEIGHT};
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const EmptyIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  color: ${({ theme }) => theme.colors.borderLight};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ─── Section Panel ─── */

const SectionPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.xl};
  }
`;

const BackButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
  }
`;

const SectionTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const SectionIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.accent};
`;

const SectionTitle = styled(BaseSectionTitle)`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
`;

const SectionContent = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.space.lg};
  overflow-y: auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.xl};
  }
`;
