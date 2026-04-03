import { describe, it, expect } from "vitest";
import { PWA_CONFIG } from "./config";
import { AppBranding } from "@hr-attendance-app/types";

describe("PWA Configuration", () => {
  it("has correct app name and short name", () => {
    expect(PWA_CONFIG.name).toBe(AppBranding.appName);
    expect(PWA_CONFIG.short_name).toBe(AppBranding.appShortName);
  });

  it("uses brand colors", () => {
    expect(PWA_CONFIG.theme_color).toBe(AppBranding.themeColor);
    expect(PWA_CONFIG.background_color).toBe("#FFFFFF");
  });

  it("configures standalone display mode", () => {
    expect(PWA_CONFIG.display).toBe("standalone");
  });

  it("includes required icon sizes", () => {
    const sizes = PWA_CONFIG.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("sets start_url to root", () => {
    expect(PWA_CONFIG.start_url).toBe("/");
  });
});
