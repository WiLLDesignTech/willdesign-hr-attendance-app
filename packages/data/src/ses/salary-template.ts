import type { PayrollBreakdown, SalaryStatementPolicy } from "@hr-attendance-app/types";
import { DEFAULT_SALARY_STATEMENT } from "@hr-attendance-app/types";

/**
 * Render salary statement HTML email.
 * Accepts optional policy-driven statement config for company/group/employee customization.
 */
export function renderSalaryStatementHtml(
  breakdown: PayrollBreakdown,
  employeeName: string,
  statementConfig?: Partial<SalaryStatementPolicy>,
): string {
  const cfg = statementConfig ? { ...DEFAULT_SALARY_STATEMENT, ...statementConfig } : DEFAULT_SALARY_STATEMENT;

  const allowanceRows = cfg.showAllowances
    ? breakdown.allowances
        .map((a) => `<tr><td>${a.name}</td><td style="text-align:right">${formatAmount(a.amount, breakdown.currency)}</td></tr>`)
        .join("")
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #f8f9fa; }
  .total { font-weight: bold; font-size: 1.1em; border-top: 2px solid ${cfg.headerBgColor}; }
  .header { background: ${cfg.headerBgColor}; color: ${cfg.headerTextColor}; padding: 16px; }
  .header h1 { margin: 0; font-size: 18px; }
  .accent { color: ${cfg.accentColor}; }
</style></head>
<body>
  <div class="header">
    <h1>${cfg.title}</h1>
  </div>
  <p>${cfg.greeting} <strong>${employeeName}</strong>,</p>
  <p>Here is your salary statement for <strong>${breakdown.yearMonth}</strong>.</p>
  <table>
    <tr><th>Component</th><th style="text-align:right">Amount (${breakdown.currency})</th></tr>
    <tr><td>Base Salary</td><td style="text-align:right">${formatAmount(breakdown.baseSalary, breakdown.currency)}</td></tr>
    ${breakdown.proRataAdjustment ? `<tr><td>Pro-rata Adjustment</td><td style="text-align:right">-${formatAmount(breakdown.proRataAdjustment, breakdown.currency)}</td></tr>` : ""}
    ${cfg.showOvertimePay && breakdown.overtimePay ? `<tr><td>Overtime Pay</td><td style="text-align:right">${formatAmount(breakdown.overtimePay, breakdown.currency)}</td></tr>` : ""}
    ${allowanceRows}
    ${cfg.showBonus && breakdown.bonus ? `<tr><td>Bonus</td><td style="text-align:right">${formatAmount(breakdown.bonus, breakdown.currency)}</td></tr>` : ""}
    ${cfg.showCommission && breakdown.commission ? `<tr><td>Commission</td><td style="text-align:right">${formatAmount(breakdown.commission, breakdown.currency)}</td></tr>` : ""}
    ${cfg.showDeficitDeduction && breakdown.deficitDeduction ? `<tr><td>Deficit Deduction</td><td style="text-align:right">-${formatAmount(breakdown.deficitDeduction, breakdown.currency)}</td></tr>` : ""}
    ${cfg.showTransferFees && breakdown.transferFees ? `<tr><td>Transfer Fees</td><td style="text-align:right">-${formatAmount(breakdown.transferFees, breakdown.currency)}</td></tr>` : ""}
    <tr class="total"><td>Net Amount</td><td style="text-align:right">${formatAmount(breakdown.netAmount, breakdown.currency)}</td></tr>
  </table>
  ${cfg.showExchangeRate && breakdown.exchangeRate ? `<p><small>Exchange rate: ${breakdown.exchangeRate} (${breakdown.exchangeRateDate}) — Equivalent: ${formatAmount(breakdown.homeCurrencyEquivalent ?? 0, breakdown.currency)}</small></p>` : ""}
  <p style="color: #888; font-size: 12px;">${cfg.footer}</p>
</body>
</html>`.trim();
}

/**
 * Format monetary amount with Intl for proper locale-aware currency display.
 * Caches formatters by currency code for batch performance.
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

function formatAmount(amount: number, currency: string): string {
  let fmt = formatterCache.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 });
    } catch {
      return `${amount.toLocaleString()} ${currency}`;
    }
    formatterCache.set(currency, fmt);
  }
  return fmt.format(amount);
}
