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

describe("AttendancePage", () => {
  it("renders attendance history section", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText("Attendance History")).toBeInTheDocument();
  });

  it("renders web clock-in controls", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByTestId("web-clock")).toBeInTheDocument();
  });

  it("renders team leave calendar section", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText("Team Calendar")).toBeInTheDocument();
  });
});
