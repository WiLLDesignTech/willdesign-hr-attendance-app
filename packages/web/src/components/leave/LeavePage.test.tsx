import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { LeavePage } from "./LeavePage";

describe("LeavePage", () => {
  it("renders leave request form", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByText(/new request/i)).toBeInTheDocument();
  });

  it("renders leave request list", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByText(/my requests/i)).toBeInTheDocument();
  });

  it("renders date picker inputs", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it("renders leave type selector", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
  });
});
