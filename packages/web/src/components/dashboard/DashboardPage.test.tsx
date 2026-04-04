import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";
import { AttendanceStates } from "@hr-attendance-app/types";

vi.mock("../../hooks/queries/useAttendance", () => ({
  useAttendanceState: () => ({
    data: { employeeId: "EMP#001", state: AttendanceStates.IDLE, lastEventTimestamp: "" },
    isLoading: false,
  }),
  useClockAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../hooks/queries/useLeave", () => ({
  useLeaveBalance: () => ({
    data: { employeeId: "EMP#001", paidLeaveTotal: 10, paidLeaveUsed: 2, paidLeaveRemaining: 8, carryOver: 0, carryOverExpiry: null, lastAccrualDate: null },
  }),
}));

vi.mock("../../hooks/queries", () => ({
  useHolidays: () => ({ data: [] }),
}));

describe("DashboardPage", () => {
  it("renders hours summary cards", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Hours Today")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("This Month")).toBeInTheDocument();
  });

  it("renders leave balance card", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Leave Balance")).toBeInTheDocument();
  });

  it("renders quick action links", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("New Leave Request")).toBeInTheDocument();
    expect(screen.getByText("View Reports")).toBeInTheDocument();
    expect(screen.getByText("View Payroll")).toBeInTheDocument();
  });
});
