import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";
import { ROUTES } from "@hr-attendance-app/types";
import { LanguageSwitcher } from "../common/LanguageSwitcher";

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const ServerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const ArrowRight = (props: { readonly "aria-hidden"?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const FEATURES = [
  { key: "attendance", icon: ClockIcon },
  { key: "leave", icon: CalendarIcon },
  { key: "payroll", icon: ChartIcon },
  { key: "team", icon: UsersIcon },
  { key: "policy", icon: ShieldIcon },
  { key: "region", icon: GlobeIcon },
] as const;

const DEPLOY_OPTIONS = [
  { key: "Saas", icon: CloudIcon },
  { key: "SelfHosted", icon: ServerIcon },
] as const;

const GRID_BLOCKS = [
  { id: "g0", accent: true },  { id: "g1", accent: false }, { id: "g2", accent: false },
  { id: "g3", accent: true },  { id: "g4", accent: false }, { id: "g5", accent: true },
] as const;

const ANIMATION_DELAY_STEP_MS = 300;

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToLogin = useCallback(() => navigate(ROUTES.LOGIN), [navigate]);

  return (
    <Page>
      <Nav>
        <NavInner>
          <LogoMark>
            <AccentDot aria-hidden />
            <LogoText>{t("app.title")}</LogoText>
          </LogoMark>
          <NavActions>
            <LanguageSwitcher />
            <LoginButton onClick={goToLogin}>
              {t("home.login")}
            </LoginButton>
          </NavActions>
        </NavInner>
      </Nav>

      <HeroSection>
        <HeroContent>
          <HeroEyebrow>
            <EyebrowLine aria-hidden />
            <span>{t("app.shortName")}</span>
          </HeroEyebrow>
          <HeroTitle>{t("home.heroTitle")}</HeroTitle>
          <HeroSubtitle>{t("home.heroSubtitle")}</HeroSubtitle>
          <HeroCTA onClick={goToLogin}>
            {t("home.getStarted")}
            <ArrowRight aria-hidden />
          </HeroCTA>
        </HeroContent>
        <HeroVisual aria-hidden>
          <HeroGrid>
            {GRID_BLOCKS.map((block, i) => (
              <GridBlock key={block.id} $delay={i} $accent={block.accent} />
            ))}
          </HeroGrid>
        </HeroVisual>
      </HeroSection>

      <FeaturesSection>
        <SectionHeader>
          <SectionTag>{t("home.featuresTitle")}</SectionTag>
          <SectionSubtitle>{t("home.featuresSubtitle")}</SectionSubtitle>
        </SectionHeader>
        <FeaturesGrid>
          {FEATURES.map(({ key, icon: Icon }) => (
            <FeatureCard key={key}>
              <IconWrap>
                <Icon />
              </IconWrap>
              <FeatureTitle>{t(`home.feature.${key}`)}</FeatureTitle>
              <FeatureDesc>{t(`home.feature.${key}Desc`)}</FeatureDesc>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesSection>

      <DeploySection>
        <SectionHeader>
          <SectionTag>{t("home.deployTitle")}</SectionTag>
          <SectionSubtitle>{t("home.deploySubtitle")}</SectionSubtitle>
        </SectionHeader>
        <DeployGrid>
          {DEPLOY_OPTIONS.map(({ key, icon: Icon }) => (
            <DeployCard key={key}>
              <IconWrap $centered>
                <Icon />
              </IconWrap>
              <DeployTitle>{t(`home.deploy${key}`)}</DeployTitle>
              <DeployDesc>{t(`home.deploy${key}Desc`)}</DeployDesc>
            </DeployCard>
          ))}
        </DeployGrid>
      </DeploySection>

      <Footer>
        <FooterInner>
          <FooterBrand>{t("app.title")}</FooterBrand>
          <FooterCopy>{t("home.footerCopy")}</FooterCopy>
        </FooterInner>
      </Footer>
    </Page>
  );
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;
`;

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  background: ${({ theme }) => theme.colors.backgroundTranslucent};
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const NavInner = styled.div`
  max-width: ${({ theme }) => theme.maxPageWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${({ theme }) => theme.header.height};
`;

const LogoMark = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const AccentDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
`;

const LogoText = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

const LoginButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accent};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  min-height: 44px;
  transition: background ${({ theme }) => theme.transition},
    color ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.textInverse};
  }

  &:focus-visible {
    box-shadow: ${({ theme }) => theme.focusRing};
    outline: none;
  }
`;

const HeroSection = styled.section`
  max-width: ${({ theme }) => theme.maxPageWidth};
  margin: 0 auto;
  padding: 120px ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.xxl};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.xxl};
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    padding-top: 100px;
    text-align: center;
  }
`;

const HeroContent = styled.div`
  animation: ${fadeUp} 600ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const HeroEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const EyebrowLine = styled.div`
  width: 24px;
  height: 2px;
  background: ${({ theme }) => theme.colors.accent};
`;

const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  margin-bottom: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  }
`;

const HeroSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  max-width: 480px;
  margin-bottom: ${({ theme }) => theme.space.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroCTA = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textInverse};
  border: none;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  min-height: 48px;
  transition: background ${({ theme }) => theme.transition},
    transform ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
    transform: translateX(2px);
  }

  &:focus-visible {
    box-shadow: ${({ theme }) => theme.focusRing};
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
  }
`;

const HeroVisual = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 80px);
  grid-template-rows: repeat(2, 80px);
  gap: ${({ theme }) => theme.space.md};
`;

const GridBlock = styled.div<{ readonly $delay: number; readonly $accent?: boolean }>`
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $accent }) =>
    $accent ? theme.colors.accent : theme.colors.surface};
  border: 1px solid ${({ theme, $accent }) =>
    $accent ? theme.colors.accent : theme.colors.borderLight};
  opacity: 0.6;
  animation: ${pulse} 3s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay * ANIMATION_DELAY_STEP_MS}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $accent }) => ($accent ? 1 : 0.6)};
  }
`;

const FeaturesSection = styled.section`
  max-width: ${({ theme }) => theme.maxPageWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.xxl};
`;

const SectionTag = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 520px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.xl};
  transition: border-color ${({ theme }) => theme.transition},
    box-shadow ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const IconWrap = styled.div<{ readonly $centered?: boolean }>`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.selected};
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: ${({ theme }) => theme.space.md};
  ${({ $centered }) => $centered && "margin-left: auto; margin-right: auto;"}
`;

const FeatureTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const FeatureDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const DeploySection = styled.section`
  max-width: ${({ theme }) => theme.maxPageWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const DeployGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const DeployCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.xl};
  text-align: center;
  transition: border-color ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const DeployTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const DeployDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-top: ${({ theme }) => theme.space.xxl};
`;

const FooterInner = styled.div`
  max-width: ${({ theme }) => theme.maxPageWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.space.sm};
    text-align: center;
  }
`;

const FooterBrand = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const FooterCopy = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
