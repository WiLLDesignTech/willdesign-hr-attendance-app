import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { PWA_CONFIG } from "./src/pwa/config";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: PWA_CONFIG.name,
        short_name: PWA_CONFIG.short_name,
        theme_color: PWA_CONFIG.theme_color,
        background_color: PWA_CONFIG.background_color,
        display: PWA_CONFIG.display,
        start_url: PWA_CONFIG.start_url,
        icons: [...PWA_CONFIG.icons],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/locales\/.+\.json$/,
            handler: "CacheFirst",
            options: {
              cacheName: "i18n-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
  },
});
