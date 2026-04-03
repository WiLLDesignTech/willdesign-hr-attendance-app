import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  it("renders language selector", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
  });

  it("renders profile section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });
});
