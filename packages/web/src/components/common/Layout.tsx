import { useState, useMemo, useCallback } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { Permissions, ROUTES } from "@hr-attendance-app/types";
import type { Permission } from "@hr-attendance-app/types";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItemConfig {
  readonly path: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly requiredPermission?: Permission;
}

const ALL_NAV_ITEMS: readonly NavItemConfig[] = [
  { path: ROUTES.DASHBOARD, labelKey: "nav.dashboard", icon: "⊞" },
  { path: ROUTES.ATTENDANCE, labelKey: "nav.attendance", icon: "◷" },
  { path: ROUTES.LEAVE, labelKey: "nav.leave", icon: "◫" },
  { path: ROUTES.REPORTS, labelKey: "nav.reports", icon: "▤" },
  { path: ROUTES.PAYROLL, labelKey: "nav.payroll", icon: "¤" },
  { path: ROUTES.TEAM, labelKey: "nav.team", icon: "⊡", requiredPermission: Permissions.LEAVE_APPROVE },
  { path: ROUTES.ADMIN, labelKey: "nav.admin", icon: "⊛", requiredPermission: Permissions.ONBOARD },
  { path: ROUTES.SETTINGS, labelKey: "nav.settings", icon: "⊘" },
];

const BOTTOM_NAV_MAX_ITEMS = 5;

export const Layout = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { permissions } = useAuth();

  const { navItems, bottomNavItems } = useMemo(() => {
    const filtered = ALL_NAV_ITEMS.filter((item) =>
      !item.requiredPermission || permissions.includes(item.requiredPermission),
    );
    return { navItems: filtered, bottomNavItems: filtered.slice(0, BOTTOM_NAV_MAX_ITEMS) };
  }, [permissions]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  return (
    <LayoutShell>
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader>
          <LogoLink to={ROUTES.DASHBOARD} onClick={closeSidebar}>
            <LogoText>{t("app.title")}</LogoText>
          </LogoLink>
        </SidebarHeader>
        <SidebarNav>
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              to={item.path}
              end={item.path === ROUTES.DASHBOARD}
              onClick={closeSidebar}
            >
              <NavIcon aria-hidden>{item.icon}</NavIcon>
              <NavLabel>{t(item.labelKey)}</NavLabel>
            </SidebarNavItem>
          ))}
        </SidebarNav>
        <SidebarFooter>
          <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>

      <Main>
        <Header>
          <MenuToggle
            onClick={toggleSidebar}
            aria-label={t("common.toggleMenu")}
          >
            ☰
          </MenuToggle>
          <HeaderTitle>{t("app.title")}</HeaderTitle>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Main>

      {sidebarOpen && (
        <Overlay onClick={closeSidebar} />
      )}

      <BottomNav>
        {bottomNavItems.map((item) => (
          <BottomNavItem
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD}
          >
            <BottomNavIcon aria-hidden>{item.icon}</BottomNavIcon>
            <BottomNavLabel>{t(item.labelKey)}</BottomNavLabel>
          </BottomNavItem>
        ))}
      </BottomNav>
    </LayoutShell>
  );
};

const LayoutShell = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: ${({ theme }) => theme.sidebar.width};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  transform: translateX(-100%);
  transition: transform ${({ theme }) => theme.transition}, width ${({ theme }) => theme.transition};

  ${({ $open }) => $open && css`transform: translateX(0);`}

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: ${({ theme }) => theme.sidebar.collapsedWidth};
    transform: translateX(0);
    overflow: hidden;

    ${({ $open }) => $open && css`
      width: ${({ theme }) => theme.sidebar.width};
    `}

    &:hover {
      width: ${({ theme }) => theme.sidebar.width};
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    transform: translateX(0);
  }
`;

const SidebarHeader = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.sidebarBorder};
  min-height: ${({ theme }) => theme.header.height};
  display: flex;
  align-items: center;
`;

const LogoLink = styled(NavLink)`
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const LogoText = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`;

const SidebarNav = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.space.sm} 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SidebarFooter = styled.div`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.sidebarBorder};
`;

const NavIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  width: 28px;
  text-align: center;
  flex-shrink: 0;
`;

const NavLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarNavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.sidebarText};
  transition: all ${({ theme }) => theme.transition};
  min-height: 44px;
  border-left: 3px solid transparent;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.textInverse};
    background: ${({ theme }) => theme.colors.sidebarHover};
  }

  &.active {
    color: ${({ theme }) => theme.colors.accent};
    border-left-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.sidebarActive};
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tabletMin}) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: ${({ theme }) => theme.sidebar.collapsedWidth};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    margin-left: ${({ theme }) => theme.sidebar.width};
  }
`;

const Header = styled.header`
  height: ${({ theme }) => theme.header.height};
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space.md};
  gap: ${({ theme }) => theme.space.md};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const Content = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.space.md};
    padding-bottom: 72px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  z-index: ${({ theme }) => theme.zIndex.overlay};

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    display: none;
  }
`;

const MenuToggle = styled.button`
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktopMin}) {
    display: none;
  }
`;

const BottomNav = styled.nav`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.background};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    z-index: ${({ theme }) => theme.zIndex.sticky};
    height: 56px;
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const BottomNavIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const BottomNavLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  line-height: 1;
`;

const BottomNavItem = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-height: 44px;
  transition: color ${({ theme }) => theme.transition};

  &.active {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;
