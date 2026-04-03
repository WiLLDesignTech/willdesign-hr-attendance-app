import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { PayrollPage } from "./PayrollPage";

describe("PayrollPage", () => {
  it("renders payroll breakdown section", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText(/payroll breakdown/i)).toBeInTheDocument();
  });

  it("renders month selector", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
  });

  it("renders salary components", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText(/base salary/i)).toBeInTheDocument();
    expect(screen.getByText(/net amount/i)).toBeInTheDocument();
  });
});
