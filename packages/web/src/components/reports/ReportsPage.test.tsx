import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { ReportsPage } from "./ReportsPage";

describe("ReportsPage", () => {
  it("renders report submission form", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText(/daily report/i)).toBeInTheDocument();
  });

  it("renders yesterday/today/blockers fields", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByLabelText(/yesterday/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/today/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blockers/i)).toBeInTheDocument();
  });

  it("renders report history section", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText(/report history/i)).toBeInTheDocument();
  });
});
