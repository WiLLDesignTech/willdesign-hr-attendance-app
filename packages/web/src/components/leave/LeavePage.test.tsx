import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { LeavePage } from "./LeavePage";

describe("LeavePage", () => {
  it("renders tab navigation", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByText("My Leave")).toBeInTheDocument();
    expect(screen.getByText("Team Calendar")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("renders date picker inputs", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("renders leave type selector", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText("Leave Type")).toBeInTheDocument();
  });
});
