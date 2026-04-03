import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders the clock widget section", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId("clock-widget")).toBeInTheDocument();
  });

  it("renders hours summary cards", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/hours today/i)).toBeInTheDocument();
    expect(screen.getByText(/this week/i)).toBeInTheDocument();
    expect(screen.getByText(/this month/i)).toBeInTheDocument();
  });

  it("renders leave balance card", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/leave balance/i)).toBeInTheDocument();
  });

  it("renders pending actions section", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
