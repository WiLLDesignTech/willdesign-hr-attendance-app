import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { PayrollReportTab } from "./PayrollReportTab";

vi.mock("../../hooks/queries", () => ({
  usePayrollReport: () => ({
    data: {
      yearMonth: "2026-04",
      generatedAt: "2026-04-05T12:00:00Z",
      entries: [
        {
          employeeId: "EMP#001",
          employeeName: "Tanaka Admin",
          employmentType: "JP_FULL_TIME",
          region: "JP",
          workedHours: 152,
          requiredHours: 160,
          leaveCredits: 0,
          deficitHours: 8,
          surplusHours: 0,
          overtimeHours: 0,
          payroll: { netAmount: 280000, currency: "JPY" },
        },
        {
          employeeId: "EMP#002",
          employeeName: "Ram Sharma",
          employmentType: "NP_FULL_TIME",
          region: "NP",
          workedHours: 168,
          requiredHours: 160,
          leaveCredits: 0,
          deficitHours: 0,
          surplusHours: 8,
          overtimeHours: 2,
          payroll: { netAmount: 50000, currency: "NPR" },
        },
      ],
      totals: {
        totalWorked: 320,
        totalRequired: 320,
        totalNet: 330000,
        totalOvertime: 2,
        totalDeficit: 8,
        totalSurplus: 8,
      },
    },
    isLoading: false,
  }),
}));

describe("PayrollReportTab", () => {
  it("renders month selector", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getByText("Month")).toBeInTheDocument();
  });

  it("renders totals summary", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getAllByText("320.0h")).toHaveLength(2);
    expect(screen.getByText("Total Worked")).toBeInTheDocument();
    expect(screen.getByText("Total Required")).toBeInTheDocument();
  });

  it("renders employee entries", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getByText("Tanaka Admin")).toBeInTheDocument();
    expect(screen.getByText("Ram Sharma")).toBeInTheDocument();
  });

  it("shows deficit badge for underfilled hours", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getByText("-8.0h")).toBeInTheDocument();
  });

  it("shows surplus badge for overfilled hours", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getByText("+8.0h")).toBeInTheDocument();
  });

  it("shows overtime badge", () => {
    renderWithProviders(<PayrollReportTab />);
    expect(screen.getByText("OT 2.0h")).toBeInTheDocument();
  });
});
