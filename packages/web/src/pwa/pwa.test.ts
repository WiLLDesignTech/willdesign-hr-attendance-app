import { describe, it, expect } from "vitest";
import { PWA_CONFIG } from "./config";

describe("PWA Configuration", () => {
  it("has correct app name and short name", () => {
    expect(PWA_CONFIG.name).toBe("WillDesign HR");
    expect(PWA_CONFIG.short_name).toBe("WD HR");
  });

  it("uses WillDesign brand colors", () => {
    expect(PWA_CONFIG.theme_color).toBe("#58C2D9");
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
