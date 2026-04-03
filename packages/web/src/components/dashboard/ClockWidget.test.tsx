import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "../../theme/theme";
import { AttendanceActions } from "@hr-attendance-app/types";
import "../../i18n/index";
import { ClockWidget } from "./ClockWidget";
import type { ReactElement } from "react";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("ClockWidget", () => {
  it("shows Clock In button when idle", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
  });

  it("shows Clock Out and Break buttons when clocked in", () => {
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={3.5} onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clock out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /break/i })).toBeInTheDocument();
  });

  it("shows Back button when on break", () => {
    renderWithTheme(<ClockWidget status="ON_BREAK" hoursToday={2} onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("fires CLOCK_IN action when idle button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /clock in/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.CLOCK_IN);
  });

  it("fires CLOCK_OUT action when clock out button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={8} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /clock out/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.CLOCK_OUT);
  });

  it("fires BREAK_START action when break button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={4} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /break/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.BREAK_START);
  });

  it("fires BREAK_END action when back button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="ON_BREAK" hoursToday={4} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.BREAK_END);
  });

  it("displays today's hours", () => {
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={5.25} onAction={vi.fn()} />);
    expect(screen.getByText("5.25h")).toBeInTheDocument();
  });

  it("renders touch-friendly buttons", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
  });

  it("shows loading state when submitting", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} onAction={vi.fn()} loading />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeDisabled();
  });
});
