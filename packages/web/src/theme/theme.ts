export const theme = {
  colors: {
    primary: "#000000",
    accent: "#58C2D9",
    accentLight: "#6DD9EC",
    accentGradient: "linear-gradient(0deg, #58C2D9 24%, #6DD9EC 93%)",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#000000",
    textSecondary: "#32373C",
    textMuted: "#888888",
    border: "#DDDDDD",
    shadow: "#D9D9D9",
    success: "#40DEC5",
    info: "#73A5DC",
    warning: "#E2498A",
    error: "#E2498A",
    hover: "#4BB8DF",
    focus: "#5636D1",
    chart1: "#58C2D9",
    chart2: "#40DEC5",
    chart3: "#73A5DC",
    chart4: "#8C89E8",
    chart5: "#E2498A",
  },
  fonts: {
    heading: '"Silom", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", monospace',
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
} as const;

export type AppTheme = typeof theme;
