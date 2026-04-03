import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { AttendancePage } from "./AttendancePage";

describe("AttendancePage", () => {
  it("renders attendance history section", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText(/attendance history/i)).toBeInTheDocument();
  });

  it("renders web clock-in controls", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByTestId("web-clock")).toBeInTheDocument();
  });

  it("renders team leave calendar section", () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText(/team calendar/i)).toBeInTheDocument();
  });
});
