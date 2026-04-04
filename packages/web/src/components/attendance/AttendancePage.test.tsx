import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { AttendancePage } from "./AttendancePage";
import { AttendanceStates } from "@hr-attendance-app/types";

vi.mock("../../hooks/queries/useAttendance", () => ({
  useAttendanceState: () => ({
    data: { employeeId: "EMP#001", state: AttendanceStates.IDLE, lastEventTimestamp: "" },
    isLoading: false,
  }),
  useAttendanceEvents: () => ({ data: [], isLoading: false }),
  useClockAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../hooks/queries", () => ({
  useAttendanceLocks: () => ({ data: [] }),
}));

describe("AttendancePage", () => {
  it("renders monthly calendar section", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText("Monthly Calendar")).toBeInTheDocument();
  });

  it("renders clock widget", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
  });

  it("renders empty state when no events", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText("No attendance records yet")).toBeInTheDocument();
  });
});
