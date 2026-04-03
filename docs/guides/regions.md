# Regions Guide

Regions represent office locations with their own labor laws, currencies, timezones, and employment types.

## Built-in Regions

### Japan (JP)
- Timezone: Asia/Tokyo
- Currency: JPY
- Overtime: 36 Agreement with deemed overtime, late-night/holiday rates
- Leave: Tenure-based accrual (10-20 days/year), 24-month carry-over
- Holidays: Auto-generated (all national holidays including substitute days)
- Employment types: Full-time, Contract, Part-time, Outsourced, Sales, Intern

### Nepal (NP)
- Timezone: Asia/Kathmandu
- Currency: NPR
- Overtime: Not tracked (flat rates)
- Leave: 1 day/month after 3-month probation, no carry-over
- Holidays: Manual entry (no auto-generation)
- Employment types: Full-time, Paid Intern, Unpaid Intern

## Adding a Region to config.yaml

```yaml
regions:
  - name: "US Office"
    code: US
    timezone: America/New_York
    currency: USD
```

This declares the region exists. For full functionality (overtime calculations, leave accrual, holidays), you also need a region strategy implementation.

## Creating a Region Strategy

Create `packages/core/src/regions/<code>/index.ts`:

```typescript
import type { RegionConfig } from "../types.js";
import { regionRegistry } from "../registry.js";

export const usRegionConfig: RegionConfig = {
  code: "US",
  name: "United States",
  currency: "USD",
  timezone: "America/New_York",
  overtimeStrategy: { /* implement */ },
  leaveAccrualStrategy: { /* implement */ },
  holidayGenerator: null,  // or implement
  payrollDeductionStrategy: { /* implement */ },
  defaultPolicy: { /* region-wide defaults */ },
  laborConstants: {},
};

regionRegistry.register(usRegionConfig);
```

### Strategy Interfaces

| Interface | Purpose |
|-----------|---------|
| `OvertimeStrategy` | `calculatePay()` and `checkLimits()` for the region's overtime rules |
| `LeaveAccrualStrategy` | `getAccrualDays()` based on policy and tenure |
| `HolidayGeneratorStrategy` | `generate(year)` returns holidays (optional) |
| `PayrollDeductionStrategy` | `calculateDeficitDeduction()` for hour deficits |

### Register the Import

Add to `packages/core/src/regions/index.ts`:

```typescript
import "./<code>/index.js";
```

## Policy Cascade

Policies resolve in 4 levels: **Region** → **Company** → **Group** → **Employee**

The region's `defaultPolicy` provides the base. Company-level overrides customize it. Group-level (per employment type) overrides the company policy. Individual employee overrides are the most specific.

See [policies.md](policies.md) for the full policy reference.
