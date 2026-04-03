# Tutorial: Adding a New Region

This guide walks through adding a US region as an example.

## Step 1: Create the Region Module

Create `packages/core/src/regions/us/index.ts`:

```typescript
import type { LeavePolicy } from "@hr-attendance-app/types";
import type {
  RegionConfig,
  OvertimeStrategy, OvertimePayInput, OvertimePayResult,
  AgreementLimitsInput, AgreementLimitsResult,
  LeaveAccrualStrategy,
  PayrollDeductionStrategy,
} from "../types.js";
import { regionRegistry } from "../registry.js";

// US Overtime: FLSA standard (1.5x after 40h/week)
const usOvertimeStrategy: OvertimeStrategy = {
  calculatePay(input: OvertimePayInput): OvertimePayResult {
    const standardPay = input.regularHours * input.hourlyRate * input.rates.standard;
    const holidayPay = input.holidayHours * input.hourlyRate * input.rates.holiday;
    return {
      standardPay,
      lateNightPay: 0,
      holidayPay,
      excess60hPay: 0,
      totalPay: standardPay + holidayPay,
    };
  },
  checkLimits(input: AgreementLimitsInput): AgreementLimitsResult {
    const weeklyUtil = input.monthlyLimit > 0
      ? input.monthlyHours / input.monthlyLimit : 0;
    return {
      monthlyWarning: weeklyUtil >= 0.9 && weeklyUtil < 1,
      monthlyExceeded: input.monthlyHours >= input.monthlyLimit,
      yearlyWarning: false,
      yearlyExceeded: false,
      monthlyUtilization: weeklyUtil,
      yearlyUtilization: 0,
    };
  },
};

// US Leave: PTO style (fixed annual grant)
const usLeaveAccrualStrategy: LeaveAccrualStrategy = {
  getAccrualDays(policy: LeavePolicy, tenureMonths: number): number {
    if (tenureMonths < policy.startConditionMonths) return 0;
    let days = 0;
    for (const tier of policy.accrualSchedule) {
      if (tenureMonths >= tier.tenureMonths) days = tier.daysGranted;
    }
    return days;
  },
};

// US Payroll: standard rounding
const usPayrollDeduction: PayrollDeductionStrategy = {
  calculateDeficitDeduction(monthlySalary, monthlyHours, deficitHours) {
    if (deficitHours <= 0) return 0;
    return Math.round((monthlySalary / monthlyHours) * deficitHours);
  },
};

export const usRegionConfig: RegionConfig = {
  code: "US",
  name: "United States",
  currency: "USD",
  timezone: "America/New_York",
  overtimeStrategy: usOvertimeStrategy,
  leaveAccrualStrategy: usLeaveAccrualStrategy,
  holidayGenerator: null,  // Add US federal holidays later
  payrollDeductionStrategy: usPayrollDeduction,
  defaultPolicy: {
    hours: {
      dailyMinimum: 8,
      weeklyMinimum: 40,
      monthlyMinimum: 160,
      workArrangement: "HYBRID",
      timeType: "FLEX",
    },
    leave: {
      accrualSchedule: [
        { tenureMonths: 0, daysGranted: 15 },   // 15 PTO from day 1
        { tenureMonths: 36, daysGranted: 20 },   // 20 PTO after 3 years
        { tenureMonths: 60, daysGranted: 25 },   // 25 PTO after 5 years
      ],
      startConditionMonths: 0,
      annualCap: 30,
      carryOverMonths: 12,
      leaveTypes: ["PAID", "UNPAID", "BEREAVEMENT", "MATERNITY"],
      mandatoryUsageDays: 0,
      terminationHandling: "FORFEIT",
    },
    overtime: {
      deemedHours: 0,
      rates: { standard: 1.5, lateNight: 1.5, holiday: 2.0, excess60h: 1.5 },
      monthlyLimit: 0,   // No monthly limit in US (FLSA is weekly)
      yearlyLimit: 0,
    },
    payment: {
      deadlineDay: 15,
      alertDaysBefore: 5,
      settlementDeadlineDay: 15,
    },
  },
  laborConstants: {
    WEEKLY_OVERTIME_THRESHOLD: 40,
    OVERTIME_RATE: 1.5,
  },
};

regionRegistry.register(usRegionConfig);
```

## Step 2: Register the Import

Edit `packages/core/src/regions/index.ts`:

```typescript
import "./us/index.js";
export { usRegionConfig } from "./us/index.js";
```

## Step 3: Add Employment Types

Create policy seed files in `packages/core/src/policies/seed/groups/`:

- `us-fulltime.ts` — salary, full benefits
- `us-parttime.ts` — hourly, limited benefits
- `us-contractor.ts` — no benefits, no overtime

## Step 4: Add to config.yaml

```yaml
regions:
  - name: "US Office"
    code: US
    timezone: America/New_York
    currency: USD
```

## Step 5: Add i18n Translations

Add employment type labels to `packages/web/src/i18n/en.json`:

```json
{
  "employmentType.US_FULL_TIME": "Full-Time",
  "employmentType.US_PART_TIME": "Part-Time",
  "region.US": "United States"
}
```

## Step 6: Write Tests

Add tests in `packages/core/__tests__/regions/us.test.ts` for:
- Overtime calculation (1.5x after 40h)
- Leave accrual (PTO tiers)
- Payroll deduction rounding
