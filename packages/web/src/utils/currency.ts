/**
 * Currency formatting utilities.
 * Centralized display formatting for monetary values.
 */

const DASH = "—";

export function formatAmount(amount: number | undefined | null, currency?: string): string {
  if (amount == null) return DASH;
  const cur = currency ?? "JPY";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(amount);
}
