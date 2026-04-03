/** PWA manifest configuration aligned with WillDesign brand. */
export const PWA_CONFIG = {
  name: "WillDesign HR",
  short_name: "WD HR",
  theme_color: "#58C2D9",
  background_color: "#FFFFFF",
  display: "standalone" as const,
  start_url: "/",
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
} as const;
