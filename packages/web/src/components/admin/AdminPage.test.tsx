import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { AdminPage } from "./AdminPage";
import en from "../../i18n/en.json";

describe("AdminPage", () => {
  it("renders sidebar nav with all section buttons", () => {
    renderWithProviders(<AdminPage />);
    const buttons = screen.getAllByRole("button");
    const buttonTexts = buttons.map((b) => b.textContent);
    expect(buttonTexts.some((t) => t?.includes(en.admin.onboarding))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes(en.admin.offboarding))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes(en.admin.policies))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes(en.admin.roles))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes(en.admin.holidays))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes(en.admin.locks))).toBe(true);
  });

  it("renders empty state when no section selected", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText(en.admin.selectSection)).toBeInTheDocument();
  });
});
