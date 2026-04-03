import { describe, it, expect } from "vitest";
import { renderSalaryStatementHtml } from "../src/ses/salary-template.js";
import { Currencies, AllowanceTypes } from "@hr-attendance-app/types";
import type { PayrollBreakdown } from "@hr-attendance-app/types";

describe("Salary Statement Template", () => {
  const jpBreakdown: PayrollBreakdown = {
    employeeId: "EMP#001",
    yearMonth: "2024-01",
    baseSalary: 300000,
    proRataAdjustment: 0,
    overtimePay: 23438,
    allowances: [
      { type: AllowanceTypes.TRANSPORTATION, name: "Transportation", amount: 15000, currency: Currencies.JPY },
    ],
    bonus: 0,
    commission: 0,
    deficitDeduction: 0,
    blendingDetails: null,
    transferFees: 0,
    netAmount: 338438,
    currency: Currencies.JPY,
    homeCurrencyEquivalent: null,
    exchangeRate: null,
    exchangeRateDate: null,
  };

  it("renders JP salary statement with all components", () => {
    const html = renderSalaryStatementHtml(jpBreakdown, "Taro Yamada");
    expect(html).toContain("Taro Yamada");
    expect(html).toContain("2024-01");
    expect(html).toContain("Base Salary");
    expect(html).toContain("Overtime Pay");
    expect(html).toContain("Transportation");
    expect(html).toContain("Net Amount");
    expect(html).toContain("Salary Statement");
  });

  it("renders NP salary with exchange rate and deficit", () => {
    const npBreakdown: PayrollBreakdown = {
      employeeId: "EMP#002",
      yearMonth: "2024-01",
      baseSalary: 50000,
      proRataAdjustment: 0,
      overtimePay: 0,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitDeduction: 1563,
      blendingDetails: null,
      transferFees: 500,
      netAmount: 47937,
      currency: Currencies.NPR,
      homeCurrencyEquivalent: 37337,
      exchangeRate: 0.77,
      exchangeRateDate: "2024-01-25",
    };
    const html = renderSalaryStatementHtml(npBreakdown, "Ram Sharma");
    expect(html).toContain("Ram Sharma");
    expect(html).toContain("Deficit Deduction");
    expect(html).toContain("Transfer Fees");
    expect(html).toContain("Exchange rate");
    expect(html).toContain("0.77");
    expect(html).toContain("NPR");
  });

  it("omits zero components", () => {
    const minimal: PayrollBreakdown = {
      employeeId: "EMP#003",
      yearMonth: "2024-02",
      baseSalary: 300000,
      proRataAdjustment: 0,
      overtimePay: 0,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitDeduction: 0,
      blendingDetails: null,
      transferFees: 0,
      netAmount: 300000,
      currency: Currencies.JPY,
      homeCurrencyEquivalent: null,
      exchangeRate: null,
      exchangeRateDate: null,
    };
    const html = renderSalaryStatementHtml(minimal, "Test User");
    expect(html).not.toContain("Overtime Pay");
    expect(html).not.toContain("Deficit Deduction");
    expect(html).not.toContain("Exchange rate");
  });

  it("uses custom statement config from policy", () => {
    const html = renderSalaryStatementHtml(jpBreakdown, "Taro Yamada", {
      title: "Acme Corp Payslip",
      footer: "Questions? Contact payroll@acme.com",
      greeting: "Hi",
      headerBgColor: "#2563EB",
      showCommission: false,
    });
    expect(html).toContain("Acme Corp Payslip");
    expect(html).toContain("Questions? Contact payroll@acme.com");
    expect(html).toContain("Hi <strong>Taro Yamada</strong>");
    expect(html).toContain("#2563EB");
  });

  it("hides components when disabled in config", () => {
    const breakdown: PayrollBreakdown = {
      ...jpBreakdown,
      overtimePay: 10000,
      bonus: 50000,
    };
    const html = renderSalaryStatementHtml(breakdown, "Test", {
      showOvertimePay: false,
      showBonus: false,
    });
    expect(html).not.toContain("Overtime Pay");
    expect(html).not.toContain("Bonus");
    expect(html).toContain("Base Salary");
  });
});
