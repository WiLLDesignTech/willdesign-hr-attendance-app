import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { TeamPage } from "./TeamPage";

describe("TeamPage", () => {
  it("renders tab navigation", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("defaults to overview tab", () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });
});
