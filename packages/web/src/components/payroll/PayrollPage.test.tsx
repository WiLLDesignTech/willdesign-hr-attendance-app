import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { PayrollPage } from "./PayrollPage";

vi.mock("../../hooks/queries/usePayroll", () => ({
  usePayroll: () => ({
    data: {
      baseSalary: 300000, overtimePay: 0, allowances: [],
      deficitDeduction: 0, netAmount: 300000, currency: "JPY",
    },
    isLoading: false,
  }),
}));

describe("PayrollPage", () => {
  it("renders payroll breakdown section", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText("Payroll Breakdown")).toBeInTheDocument();
  });

  it("renders month selector", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
  });

  it("renders salary components", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText("Base Salary")).toBeInTheDocument();
    expect(screen.getByText("Net Amount")).toBeInTheDocument();
  });
});
