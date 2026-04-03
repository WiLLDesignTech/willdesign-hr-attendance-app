import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  /* CSS Custom Properties — mirrors theme for external consumption */
  :root {
    --wd-color-primary: ${({ theme }) => theme.colors.primary};
    --wd-color-accent: ${({ theme }) => theme.colors.accent};
    --wd-color-accent-gradient: ${({ theme }) => theme.colors.accentGradient};
    --wd-color-background: ${({ theme }) => theme.colors.background};
    --wd-color-surface: ${({ theme }) => theme.colors.surface};
    --wd-color-text: ${({ theme }) => theme.colors.text};
    --wd-color-text-muted: ${({ theme }) => theme.colors.textMuted};
    --wd-color-border: ${({ theme }) => theme.colors.border};
    --wd-color-success: ${({ theme }) => theme.colors.success};
    --wd-color-info: ${({ theme }) => theme.colors.info};
    --wd-color-warning: ${({ theme }) => theme.colors.warning};
    --wd-color-error: ${({ theme }) => theme.colors.error};
    --wd-color-hover: ${({ theme }) => theme.colors.hover};
    --wd-color-focus: ${({ theme }) => theme.colors.focus};
    --wd-font-heading: ${({ theme }) => theme.fonts.heading};
    --wd-font-body: ${({ theme }) => theme.fonts.body};
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    line-height: ${({ theme }) => theme.lineHeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    line-height: ${({ theme }) => theme.lineHeights.tight};
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transition};

    &:hover {
      color: ${({ theme }) => theme.colors.hover};
    }
  }

  /* Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
