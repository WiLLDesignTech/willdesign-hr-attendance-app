# Policy System Reference

The policy engine uses a cascading system where each level can override the previous.

## Cascade Order

```
Region Defaults → Company Override → Group Override → Employee Override
```

Arrays are **replaced entirely** (not merged). Objects are deep-merged field by field.

## Policy Structure

```typescript
interface RawPolicy {
  hours?: {
    dailyMinimum: number;       // e.g., 8
    weeklyMinimum: number;      // e.g., 40
    monthlyMinimum: number;     // e.g., 160
    workArrangement: "OFFICE" | "REMOTE" | "HYBRID";
    timeType: "FIXED" | "FLEX" | "FULL_FLEX";
    coreHoursStart?: string;    // e.g., "10:00"
    coreHoursEnd?: string;      // e.g., "15:00"
  };

  leave?: {
    accrualSchedule: { tenureMonths: number; daysGranted: number }[];
    startConditionMonths: number;
    annualCap: number;
    carryOverMonths: number;
    leaveTypes: string[];
    mandatoryUsageDays: number;
    terminationHandling: "FORFEIT" | "LABOR_LAW";
  };

  overtime?: {
    deemedHours: number;
    rates: {
      standard: number;     // e.g., 1.25
      lateNight: number;    // e.g., 0.25
      holiday: number;      // e.g., 1.35
      excess60h: number;    // e.g., 1.5
    };
    monthlyLimit: number;
    yearlyLimit: number;
  };

  compensation?: {
    salaryType: "MONTHLY" | "ANNUAL" | "HOURLY";
    bonusSchedule: { month: number; multiplier: number }[];
    allowanceTypes: { type: string; name: string; defaultAmount: number }[];
    commissionTracking: boolean;
  };

  probation?: {
    durationMonths: number;
    leaveAllowed: boolean;
    noticePeriodDays: number;
  };

  payment?: {
    deadlineDay: number;        // e.g., 31 (last day) or 15
    alertDaysBefore: number;
    settlementDeadlineDay: number;
  };
}
```

## Examples

### Japanese Full-Time Employee
Region (JP) provides: 8h/day, overtime at 1.25x, 10-20 days leave.
Group (JP_FULL_TIME) adds: 45h deemed overtime.

### Nepal Contractor
Region (NP) provides: remote work, 1 day/month leave, no overtime tracking.
Group (NP_FULL_TIME) inherits NP base.

### Override: Individual Employee
An employee override can change any field:
```json
{
  "hours": { "monthlyMinimum": 120 },
  "leave": { "annualCap": 25 }
}
```

## Effective Policy Resolution

Use `resolveCascadeWithRegion()`:

```typescript
import { resolveCascadeWithRegion } from "@hr-attendance-app/core";

const effective = resolveCascadeWithRegion(
  regionConfig.defaultPolicy,  // JP defaults
  companyPolicy,               // company overrides
  groupPolicy,                 // employment type overrides
  employeePolicy,              // individual overrides
);
```
