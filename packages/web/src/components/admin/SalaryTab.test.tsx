import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { SalaryTab } from "./SalaryTab";

vi.mock("../../hooks/queries", () => ({
  useEmployees: () => ({
    data: [
      { id: "EMP#001", name: "Tanaka Admin", email: "admin@example.com", employmentType: "JP_FULL_TIME", region: "JP", status: "ACTIVE" },
      { id: "EMP#002", name: "Yamada Taro", email: "taro@example.com", employmentType: "JP_FULL_TIME", region: "JP", status: "ACTIVE" },
    ],
  }),
  useSalaryHistory: () => ({
    data: [],
    isLoading: false,
  }),
  useAddSalaryEntry: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("SalaryTab", () => {
  it("renders employee selector", () => {
    renderWithProviders(<SalaryTab />);
    expect(screen.getByText("Select Employee")).toBeInTheDocument();
  });

  it("renders employee options in dropdown", () => {
    renderWithProviders(<SalaryTab />);
    expect(screen.getByText("Tanaka Admin")).toBeInTheDocument();
    expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
  });

  it("shows select prompt initially", () => {
    renderWithProviders(<SalaryTab />);
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });
});
