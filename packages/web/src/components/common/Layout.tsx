import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.dashboard" },
  { path: "/attendance", labelKey: "nav.attendance" },
  { path: "/leave", labelKey: "nav.leave" },
  { path: "/reports", labelKey: "nav.reports" },
  { path: "/payroll", labelKey: "nav.payroll" },
  { path: "/team", labelKey: "nav.team" },
  { path: "/admin", labelKey: "nav.admin" },
  { path: "/settings", labelKey: "nav.settings" },
] as const;

const LayoutShell = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: ${({ theme }) => theme.sidebar.width};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform ${({ theme }) => theme.transition};

  ${({ $open }) => $open && css`transform: translateX(0);`}

  @media (min-width: 640px) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: ${({ theme }) => theme.sidebar.collapsedWidth};
    transform: translateX(0);
    ${({ $open }) => $open && css`width: ${({ theme }) => theme.sidebar.width};`}
  }

  @media (min-width: 1025px) {
    transform: translateX(0);
  }
`;

const SidebarHeader = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogoLink = styled(NavLink)`
  color: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 18px;
`;

const LogoText = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`;

const SidebarNav = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.space.sm} 0;
  overflow-y: auto;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  color: rgba(255, 255, 255, 0.7);
  transition: all ${({ theme }) => theme.transition};
  min-height: 44px;

  &:hover {
    color: ${({ theme }) => theme.colors.background};
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: ${({ theme }) => theme.colors.accent};
    border-left: 3px solid ${({ theme }) => theme.colors.accent};
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (min-width: 640px) and (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: ${({ theme }) => theme.sidebar.collapsedWidth};
  }

  @media (min-width: 1025px) {
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
  z-index: 50;
`;

const HeaderTitle = styled.h1`
  font-size: 16px;
  font-weight: 600;
`;

const Content = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-bottom: 72px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;

  @media (min-width: 1025px) {
    display: none;
  }
`;

const MenuToggle = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;

  @media (min-width: 1025px) {
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
    z-index: 100;
    height: 56px;
  }
`;

const BottomNavItem = styled(NavLink)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-height: 44px;

  &.active {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export function Layout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LayoutShell>
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader>
          <LogoLink to="/">
            <LogoText>WiLL Design HR</LogoText>
          </LogoLink>
        </SidebarHeader>
        <SidebarNav>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
            >
              {t(item.labelKey)}
            </NavItem>
          ))}
        </SidebarNav>
      </Sidebar>

      <Main>
        <Header>
          <MenuToggle
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
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
        <Overlay onClick={() => setSidebarOpen(false)} />
      )}

      <BottomNav>
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <BottomNavItem key={item.path} to={item.path}>
            {t(item.labelKey)}
          </BottomNavItem>
        ))}
      </BottomNav>
    </LayoutShell>
  );
}
