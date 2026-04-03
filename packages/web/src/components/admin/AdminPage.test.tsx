import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  it("renders onboarding section", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole("button", { name: "Onboarding" })).toBeInTheDocument();
  });

  it("renders offboarding section", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole("button", { name: "Offboarding" })).toBeInTheDocument();
  });

  it("renders policy builder tab", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole("button", { name: "Policies" })).toBeInTheDocument();
  });

  it("renders role management tab", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole("button", { name: "Roles" })).toBeInTheDocument();
  });

  it("renders holiday calendar tab", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole("button", { name: "Holidays" })).toBeInTheDocument();
  });
});
