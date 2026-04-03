import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { TeamPage } from "./TeamPage";

describe("TeamPage", () => {
  it("renders team hours overview", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByText(/team overview/i)).toBeInTheDocument();
  });

  it("renders flag management section", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByText("Flags")).toBeInTheDocument();
  });

  it("renders surplus banking section", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByText("Surplus Banking")).toBeInTheDocument();
  });

  it("renders missing reports tracker", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByText(/missing reports/i)).toBeInTheDocument();
  });
});
