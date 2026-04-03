/**
 * Design tokens for the HR Attendance App.
 * Generated with ui-ux-pro-max design intelligence.
 * WillDesign brand defaults — change color values here to rebrand.
 *
 * Style: Flat Design (clean, minimal, no heavy shadows, typography-focused)
 * Performance: Excellent | Accessibility: WCAG AAA target
 */

export const theme = {
  colors: {
    // Brand
    primary: "#000000",
    accent: "#58C2D9",
    accentLight: "#6DD9EC",
    accentGradient: "linear-gradient(0deg, #58C2D9 24%, #6DD9EC 93%)",

    // Surfaces
    background: "#FFFFFF",
    surface: "#F8F9FA",
    surfaceHover: "#F1F3F5",
    overlay: "rgba(0, 0, 0, 0.5)",

    // Text
    text: "#000000",
    textSecondary: "#32373C",
    textMuted: "#888888",
    textInverse: "#FFFFFF",

    // Borders & Dividers
    border: "#DDDDDD",
    borderLight: "#EEEEEE",
    shadow: "#D9D9D9",

    // Semantic
    success: "#40DEC5",
    successLight: "#E6FAF6",
    info: "#73A5DC",
    infoLight: "#EBF2FA",
    warning: "#F0AD4E",
    warningLight: "#FFF8EC",
    error: "#E2498A",
    errorLight: "#FDEEF4",
    danger: "#E2498A",

    // Interactive
    hover: "#4BB8DF",
    focus: "#5636D1",
    selected: "#EBF7FA",

    // Chart palette
    chart1: "#58C2D9",
    chart2: "#40DEC5",
    chart3: "#73A5DC",
    chart4: "#8C89E8",
    chart5: "#E2498A",
  },

  fonts: {
    heading: '"Silom", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  },

  // Typography scale (1.25 ratio — Major Third)
  fontSizes: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    md: "1.125rem",   // 18px
    lg: "1.25rem",    // 20px
    xl: "1.5rem",     // 24px
    "2xl": "1.875rem", // 30px
    "3xl": "2.25rem",  // 36px
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },

  radii: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    full: "9999px",
  },

  // Flat design: minimal shadows, subtle depth
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
    lg: "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04)",
    xl: "0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04)",
  },

  // Focus ring: visible, accessible, brand-aligned
  focusRing: "0 0 0 2px #FFFFFF, 0 0 0 4px #5636D1",

  // Z-index scale (10-step system per ui-ux-pro-max recommendation)
  zIndex: {
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },

  transition: "150ms ease-in-out",

  breakpoints: {
    mobile: "639px",
    tablet: "1024px",
  },

  sidebar: {
    width: "240px",
    collapsedWidth: "60px",
  },

  header: {
    height: "56px",
  },

  // Max content width for readability (65-75 chars)
  maxContentWidth: "720px",
} as const;

export type AppTheme = typeof theme;
