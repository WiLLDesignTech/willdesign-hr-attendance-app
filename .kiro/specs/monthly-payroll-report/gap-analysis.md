# Gap Analysis — Monthly Payroll Report

## Summary

The codebase has strong foundations for payroll (calculator, overtime, policy cascade, salary CRUD, basic report generation, email template) but critical gaps exist in **persistence**, **workflow execution**, and **new features**. The pattern is consistent: pure business logic functions exist in `packages/core` but handlers don't persist results to the database. New features (quota redistribution, surplus banking, settlement, force majeure) have partial logic stubs but no API endpoints, no repository storage, and no frontend UI.

---

## Requirement-to-Asset Map

### Requirement 1: Policy-Driven Hours Resolution
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| 4-level policy cascade | **Exists** | `PolicyService.resolveForEmployee()` | None |
| `hoursPolicy.monthlyMinimum` | **Exists** | `policy.ts:HoursPolicy` | None |
| Leave type hour credits | **Partial** | `leave.ts:LeaveType` has SHIFT_PERMISSION, CREDITED_ABSENCE | **Missing**: No hour-credit mapping per leave type (which types credit hours, how many) |
| Holiday subtraction | **Missing** | HolidayRepository exists | **Missing**: Not wired into payroll calculation |
| Quota redistribution override | **Partial** | `validateQuotaPlan()`, `createQuotaPlan()` in flags/service.ts | **Missing**: Not linked to payroll hours resolution |

### Requirement 2: Salary History + Blending
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Salary CRUD | **Exists** | `SalaryRepository`, admin handlers | None |
| Blended calculation | **Exists** | `calculateBlendedSalary()` in calculator.ts | None |
| BlendingDetails in breakdown | **Partial** | Calculator returns details | **Missing**: MonthlyPayrollReportService doesn't pass blending details through |

### Requirement 3: Overtime Calculation
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| JP tiered rates | **Exists** | `OvertimeCalculator`, JP region config | None |
| Deemed overtime (みなし残業) | **Exists** | `checkDeemedOvertimeThreshold()` | None |
| 36 Agreement checks | **Exists** | `check36AgreementLimits()` | None |
| NP no-overtime-pay rule | **Exists** | NP region rates set to 1.0× | None |
| NP surplus for banking | **Missing** | — | **Missing**: Surplus recorded but not linked to banking |

### Requirement 4: Allowance Management
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Allowance types in policy | **Exists** | `CompensationPolicy.allowanceTypes` | None |
| Allowances in payroll | **Missing** | Hardcoded `[]` in report service | **Missing**: Not reading from policy/employee config |
| Allowance CRUD per employee | **Missing** | — | **Missing**: No storage, no API, no UI |

### Requirement 5: Deficit Deduction with Manager Approval
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Deficit calculation | **Exists** | `calculateDeficitDeduction()` | None |
| Region rounding (ceil/round) | **Exists** | Region strategies | None |
| Manager approval via flags | **Partial** | `resolveFlag()` pure function exists | **Critical**: Resolution NOT persisted to database |
| Bank offset during resolution | **Partial** | `applyBankOffset()` exists | **Critical**: Bank entries NOT debited after offset |

### Requirement 6: Monthly Report Generation
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Batch generation | **Exists** | `MonthlyPayrollReportService.generate()` | None |
| Error flag per employee | **Missing** | — | **Missing**: Fails entire report on one error |
| Sorting by region/name | **Missing** | — | **Missing**: Not sorted |

### Requirement 7: Transfer Fees + Exchange Rates
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Data model | **Exists** | `PayrollBreakdown.transferFees`, `exchangeRate` | None |
| Admin input flow | **Missing** | — | **Missing**: No endpoint/UI to enter per-month rates |
| Company-paid transfer fee | **Missing** | — | **Missing**: Not deducted from net in code |

### Requirement 8: Pro-Rata
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Pro-rata calculation | **Exists** | `calculateProRata()` | None |
| Calendar days formula | **Partial** | Uses remaining/total | Need to verify calendar vs working days |

### Requirement 9: RBAC for All Features
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Employee payroll (own only) | **Exists** | Auth check in handler | None |
| SALARY_MANAGE for report | **Exists** | Permission check | None |
| AI_AGENT read-only | **Exists** | Role check | None |
| Manager scoped to reports | **Missing** | — | **Missing**: No manager-scoped payroll view |
| QUOTA_MANAGE permission | **Missing** | — | **Missing**: Not defined in permissions.ts |
| SETTLEMENT permissions | **Missing** | — | **Missing**: Not defined |
| Force majeure permissions | **Missing** | — | **Missing**: Not defined |

### Requirement 10: CSV Export
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| CSV generation | **Missing** | — | **Missing**: No export utility anywhere |
| Export endpoint | **Missing** | — | **Missing**: No API route |
| Frontend download button | **Missing** | — | **Missing**: No UI |

### Requirement 11-12: Payroll UI (Employee + Admin)
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| PayrollPage | **Exists** | PayrollPage.tsx | Working, needs polish |
| PayrollReportTab | **Exists** | PayrollReportTab.tsx | Working, needs export + expansion |
| SalaryTab | **Exists** | SalaryTab.tsx | Working |
| Quota redistribution display | **Missing** | — | **Missing**: No UI for adjusted hours |
| Bank offset display | **Missing** | — | **Missing**: No display of offset applied |

### Requirement 13: Salary Statement Delivery
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| HTML template | **Exists** | `salary-template.ts` | Complete with policy-driven visibility |
| SES adapter | **Exists** | `SESEmailAdapter` | Adapter exists |
| Wiring/composition | **Missing** | — | **Critical**: Not instantiated, no trigger logic |
| Delivery tracking | **Missing** | — | **Missing**: No status tracking |

### Requirement 14: PolicyService Caching
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| TTL cache | **Missing** | — | **Missing**: No caching layer |
| Cache invalidation | **Missing** | — | **Missing**: No invalidation on policy update |

### Requirement 15: Audit Trail
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Audit types/interface | **Exists** | `audit.ts` types, AuditService | Basic structure |
| Logging in services | **Partial** | Leave + offboarding log audits | **Missing**: Flags, banking, quotas, payroll generation NOT audited |
| Immutability | **Exists** | Append-only design | None |

### Requirement 16: Quota Redistribution
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Validation logic | **Exists** | `validateQuotaPlan()` | Complete, tested |
| Plan creation | **Exists** | `createQuotaPlan()` | Complete |
| Types | **Exists** | `QuotaPlan`, `QuotaMonth` in override.ts | Complete |
| API endpoint | **Stub** | `quotas.ts` returns hardcoded 12×160h | **Critical**: Handler is a stub |
| Repository/storage | **Missing** | — | **Missing**: No QuotaPlan repository |
| Manager approval workflow | **Missing** | — | **Missing**: No submit/approve flow |
| Payroll integration | **Missing** | — | **Missing**: Not linked to hours resolution |
| Pre-start validation | **Missing** | — | **Missing**: No check that plan starts in future |

### Requirement 17: Surplus Hour Banking
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| BankEntry model | **Exists** | `banking.ts:BankEntry` | Complete |
| Entry creation | **Exists** | `createBankEntry()` | Logic exists, no persistence |
| Expiry check | **Exists** | `isExpired()` | Logic exists |
| Approval endpoint | **Exists** | `POST /api/bank/approve` | Basic approval |
| Entry creation endpoint | **Missing** | — | **Missing**: No POST /api/bank to create |
| Max days enforcement | **Missing** | — | **Missing**: No policy limit on bankable hours |
| Expiry notifications | **Missing** | — | **Missing**: No 30-day warning |
| Expiry cleanup cron | **Missing** | — | **Missing**: No auto-expiry |

### Requirement 18: Surplus Bank Offset
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Offset calculation | **Exists** | `applyBankOffset()` | Consumes oldest-first |
| Flag resolution with offset | **Partial** | `resolveFlag()` accepts bankOffsetHours | **Critical**: Bank entries not debited in DB |
| No retroactive reversal | **Missing** | — | **Missing**: No enforcement of deficit→surplus rule |

### Requirement 19: Termination Settlement
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Settlement preview | **Exists** | `getSettlementPreview()` | Pro-rata only |
| Employee deactivation | **Exists** | `offboard()` | Complete |
| Leave payout | **Missing** | — | **Missing**: No unused leave calculation |
| Quota redistribution unwind | **Missing** | — | **Missing**: No recalculation to standard hours |
| Bank hours settlement | **Missing** | — | **Missing**: No payout/forfeit logic |
| Settlement execution | **Missing** | — | **Missing**: No execute endpoint |

### Requirement 20: Force Majeure
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Hours adjustment | **Exists** | `calculateForceMajeureAdjustment()` | Complete, tested |
| 30-day termination trigger | **Exists** | In adjustment function | Complete |
| Event recording | **Missing** | — | **Missing**: No API/storage for events |
| Admin trigger | **Missing** | — | **Missing**: No endpoint |
| Policy config | **Missing** | — | **Missing**: Hardcoded 30 days |

### Requirement 21: Policy-Driven Config
| Need | Status | Asset | Gap |
|------|--------|-------|-----|
| Policy cascade | **Exists** | 4-level cascade working | None |
| All fields in policy | **Partial** | Core fields exist | **Missing**: Banking expiry, max banked days, quota eligibility, force majeure threshold NOT in policy |
| Region defaults | **Exists** | JP + NP defaults | Need expansion for missing fields |

---

## Implementation Approach

### Recommended: Option C — Hybrid Approach

The feature set naturally divides into three tiers:

**Tier 1: Extend existing components** (fix critical persistence gaps)
- Wire `resolveFlag()` result to FlagRepository.update()
- Wire `applyBankOffset()` to BankRepository.update()
- Pass BlendingDetails through MonthlyPayrollReportService
- Read allowances from policy in PayrollService
- Add error handling + sorting to report generation
- Add PolicyService caching (in-memory Map with TTL)

**Tier 2: New services + endpoints** (quota, banking, settlement)
- QuotaRedistributionService + QuotaPlanRepository + API endpoints
- Surplus banking creation endpoint + expiry cron
- Settlement calculation service (extend OffboardingService)
- Force majeure event recording + API
- CSV export utility + endpoint

**Tier 3: Frontend + delivery** (UI updates, email)
- Payroll export button
- Quota redistribution UI (request + approval)
- Surplus bank balance display
- Wire SES email adapter for salary statements
- New permissions (QUOTA_MANAGE, etc.)

---

## Effort & Risk Assessment

| Requirement | Effort | Risk | Justification |
|-------------|--------|------|---------------|
| 1. Policy hours | S | Low | Extend existing service, add leave type mapping |
| 2. Salary blending | S | Low | Calculator done, pass details through |
| 3. Overtime | S | Low | Already complete, minor wiring |
| 4. Allowances | M | Low | New CRUD + policy integration |
| 5. Deficit deduction | M | Medium | Critical persistence gap, flag workflow |
| 6. Report generation | S | Low | Add error handling + sorting |
| 7. Transfer fees | M | Low | New admin input flow |
| 8. Pro-rata | S | Low | Calculator exists |
| 9. RBAC | M | Medium | New permissions + scoping logic |
| 10. CSV export | S | Low | Utility function + endpoint |
| 11-12. UI updates | M | Low | Extend existing components |
| 13. Salary statements | M | Medium | Wire SES + trigger logic |
| 14. PolicyService cache | S | Low | In-memory Map with TTL |
| 15. Audit trail | M | Low | Extend logging across services |
| 16. Quota redistribution | L | Medium | New service + repo + API + UI + approval |
| 17. Surplus banking | L | Medium | Complete banking lifecycle |
| 18. Bank offset | M | Medium | Persistence + business rules |
| 19. Settlement | L | High | Complex calculation, compliance |
| 20. Force majeure | M | Medium | New event system |
| 21. Policy config | M | Low | Add missing fields to types + cascade |

**Overall: XL (3-4 weeks)** — Multiple new services, 6+ new API endpoints, 3 new repository implementations, significant UI additions.

---

## Critical Research Items for Design Phase

1. **Flag persistence model**: How to store resolution status + who resolved + when? Extend existing Flag type or new ResolutionRecord?
2. **QuotaPlan storage**: Single-table DynamoDB key pattern for quota plans? `PK: QUOTA, SK: EMPLOYEE#{id}#PLAN#{planId}`?
3. **Bank entry lifecycle**: When exactly does surplus become a bank entry? End-of-month cron or on-demand?
4. **Settlement compliance**: What legal requirements for NP settlement beyond pro-rata + leave? Tax implications?
5. **Force majeure evidence**: What metadata to store (date range, description, proof document ID)?
6. **Cron job scheduling**: EventBridge rules needed for: bank expiry cleanup, flag auto-deduction, statement delivery
7. **Policy type expansion**: Adding 5+ new fields to RawPolicy — backward compatibility with existing stored policies?

---

## Recommendations for Design Phase

1. **Start with persistence fixes** (Tier 1) — unblocks the entire flag/banking workflow
2. **Design QuotaPlan DynamoDB key pattern** early — it's a new entity class
3. **Add missing permissions** before implementing endpoints — single PR for permissions.ts + ROLE_PERMISSIONS
4. **Policy type expansion** should be a single coordinated change with region defaults
5. **CSV export** is a quick win — implement early for immediate admin value
6. **Settlement is highest risk** — consider phasing: preview-only in v1, execute in v2
