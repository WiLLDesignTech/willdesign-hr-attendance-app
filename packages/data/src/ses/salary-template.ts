import type { PayrollBreakdown } from "@hr-attendance-app/types";
import { AppBranding, Currencies } from "@hr-attendance-app/types";

/**
 * Render salary statement HTML email.
 */
export function renderSalaryStatementHtml(breakdown: PayrollBreakdown, employeeName: string): string {
  const allowanceRows = breakdown.allowances
    .map((a) => `<tr><td>${a.name}</td><td style="text-align:right">${formatAmount(a.amount, breakdown.currency)}</td></tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, sans-serif; color: #000; max-width: 600px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #f8f9fa; }
  .total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #000; }
  .header { background: #000; color: #fff; padding: 16px; }
  .header h1 { margin: 0; font-size: 18px; }
  .accent { color: #58C2D9; }
</style></head>
<body>
  <div class="header">
    <h1>${AppBranding.salaryStatementTitle}</h1>
  </div>
  <p>Dear <strong>${employeeName}</strong>,</p>
  <p>Here is your salary statement for <strong>${breakdown.yearMonth}</strong>.</p>
  <table>
    <tr><th>Component</th><th style="text-align:right">Amount (${breakdown.currency})</th></tr>
    <tr><td>Base Salary</td><td style="text-align:right">${formatAmount(breakdown.baseSalary, breakdown.currency)}</td></tr>
    ${breakdown.proRataAdjustment ? `<tr><td>Pro-rata Adjustment</td><td style="text-align:right">-${formatAmount(breakdown.proRataAdjustment, breakdown.currency)}</td></tr>` : ""}
    ${breakdown.overtimePay ? `<tr><td>Overtime Pay</td><td style="text-align:right">${formatAmount(breakdown.overtimePay, breakdown.currency)}</td></tr>` : ""}
    ${allowanceRows}
    ${breakdown.bonus ? `<tr><td>Bonus</td><td style="text-align:right">${formatAmount(breakdown.bonus, breakdown.currency)}</td></tr>` : ""}
    ${breakdown.commission ? `<tr><td>Commission</td><td style="text-align:right">${formatAmount(breakdown.commission, breakdown.currency)}</td></tr>` : ""}
    ${breakdown.deficitDeduction ? `<tr><td>Deficit Deduction</td><td style="text-align:right">-${formatAmount(breakdown.deficitDeduction, breakdown.currency)}</td></tr>` : ""}
    ${breakdown.transferFees ? `<tr><td>Transfer Fees</td><td style="text-align:right">-${formatAmount(breakdown.transferFees, breakdown.currency)}</td></tr>` : ""}
    <tr class="total"><td>Net Amount</td><td style="text-align:right">${formatAmount(breakdown.netAmount, breakdown.currency)}</td></tr>
  </table>
  ${breakdown.exchangeRate ? `<p><small>Exchange rate: ${breakdown.exchangeRate} (${breakdown.exchangeRateDate}) — JPY equivalent: ¥${breakdown.jpyEquivalent?.toLocaleString()}</small></p>` : ""}
  <p style="color: #888; font-size: 12px;">${AppBranding.salaryStatementFooter}</p>
</body>
</html>`.trim();
}

function formatAmount(amount: number, currency: string): string {
  if (currency === Currencies.JPY) return `¥${amount.toLocaleString()}`;
  if (currency === Currencies.NPR) return `Rs. ${amount.toLocaleString()}`;
  return `${amount.toLocaleString()} ${currency}`;
}
