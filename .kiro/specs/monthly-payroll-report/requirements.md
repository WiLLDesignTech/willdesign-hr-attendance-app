# Requirements Document

## Introduction

The Monthly Payroll Report feature provides a comprehensive, policy-driven payroll pipeline that ties together attendance hours, leave, absences, salary history, overtime, allowances, quota redistribution, surplus hour banking, and region-specific rules to produce a transparent, auditable monthly payroll breakdown per employee.

The system already has foundational components (payroll calculator, overtime calculator, policy cascade, salary CRUD, basic report generation) — these requirements formalize the complete pipeline including gaps: quota redistribution (deferred hours), surplus hour banking with offset rules, allowance/bonus/commission tracking, exchange rate management, transfer fees, blended salary propagation, leave type hour credits, final settlement, report export, and salary statement delivery.

The feature serves two regions with distinct labor/contract laws:
- **Japan** (Japanese Labor Law 労働基準法) — overtime tiers, deemed overtime (みなし残業), 36 Agreement, mandatory 5-day leave, JPY rounding
- **Nepal** (Contract Act 2056) — independent contractors, ceiling rounding for deductions, NPR via Wise with transfer fees, surplus banking, quota redistribution, no overtime pay

All rules (hours, leave, overtime, compensation, deficit, surplus, quota) must be **policy-driven via the 4-level cascade** (region → company → group → employee) — never hardcoded.

## Requirements

### Requirement 1: Policy-Driven Hours Resolution
**Objective:** As an admin, I want monthly required hours calculated from each employee's resolved policy (not hardcoded), so that different employment types (full-time 160h, part-time ~90h, paid intern 80h) are handled automatically.

#### Acceptance Criteria
1. When generating a payroll report for a given month, the PayrollService shall resolve the employee's effective policy via the 4-level cascade (region defaults → company → group → employee).
2. The PayrollService shall use `hoursPolicy.monthlyMinimum` from the resolved policy as the base required hours for the month.
3. When the employee has approved leave days in the target month, the PayrollService shall apply leave type hour credits from the resolved policy: Paid Leave credits `hoursPolicy.dailyMinimum` per day, Unpaid Leave credits 0h, Shift Permission credits 0h (compensated later), Credited Absence credits `hoursPolicy.dailyMinimum` per day (special manager approval).
4. When the target month contains holidays (from HolidayRepository for the employee's region), the PayrollService shall subtract holiday count from required working days.
5. The PayrollService shall calculate actual worked hours by aggregating attendance events (clock-in to clock-out sessions, minus break time) for the target month using AttendanceHoursCalculator.
6. The PayrollService shall compute deficit as `max(0, requiredHours - workedHours - paidLeaveCredits - creditedAbsenceHours)` and surplus as `max(0, workedHours - requiredHours)`.
7. When an active quota redistribution exists for the target month, the PayrollService shall use the adjusted required hours instead of `hoursPolicy.monthlyMinimum` (see Requirement 16).

### Requirement 2: Salary History and Blended Calculation
**Objective:** As an admin, I want salary changes with effective dates tracked so that mid-month changes produce a correctly blended salary for payroll.

#### Acceptance Criteria
1. When an admin adds a salary entry, the SalaryService shall store the record with amount, currency, salary type (MONTHLY/ANNUAL/HOURLY), change type (INITIAL, REVIEW, PROMOTION, ADJUSTMENT, PROBATION_END), effective date, and optional reason.
2. When calculating payroll for a month with a single effective salary, the PayrollService shall use that salary as the base amount (converting ANNUAL ÷ 12, HOURLY × monthlyMinimum).
3. When two or more salary changes take effect within the same month, the PayrollService shall calculate a blended salary using pro-rata segments (each segment = amount × days / totalDays) and include BlendingDetails in the breakdown.
4. If no salary record exists for an employee at the target month, the PayrollService shall return an error indicating missing salary data for that employee.

### Requirement 3: Overtime Calculation
**Objective:** As an admin, I want overtime hours and pay calculated per region-specific rules, so that Japan's tiered rates and deemed overtime (みなし残業) are applied correctly while Nepal has no overtime pay.

#### Acceptance Criteria
1. When an employee's worked hours exceed the monthly required hours, the OvertimeCalculator shall categorize excess hours by type: standard, late-night, holiday, and excess-60h (JP only).
2. The OvertimeCalculator shall apply region-specific multipliers from the employee's resolved overtime policy: JP standard 1.25×, late-night 1.5× (1.25 + 0.25), holiday 1.35×, excess-60h 1.5×; NP standard 1.0×.
3. Where the employee's policy includes deemed overtime (みなし残業), the PayrollService shall include deemed hours in base salary and only calculate additional overtime pay for hours exceeding the deemed threshold.
4. While generating a JP payroll report, the OvertimeCalculator shall check 36 Agreement limits (45h/month, 360h/year) and flag entries that exceed 85% utilization as warnings.
5. The PayrollService shall calculate overtime pay as the sum of (hours × hourlyRate × multiplier) for each overtime category.
6. Where the employee's region is Nepal, the PayrollService shall record surplus hours for banking purposes but shall NOT calculate any overtime pay — the monthly fee is the maximum compensation.

### Requirement 4: Allowance Management
**Objective:** As an admin, I want to configure and track allowances per employee (transportation, housing, position, custom), so that monthly payroll includes all compensation components.

#### Acceptance Criteria
1. The PayrollService shall read allowance types and default amounts from the employee's resolved compensation policy.
2. When an employee has active allowances configured, the PayrollService shall include each allowance as a named line item (type + amount) in the payroll breakdown.
3. When an admin updates an employee's allowances, the system shall store the change with an effective date and apply it to payroll calculations for months on or after that date.
4. The PayrollBreakdown shall include the sum of all allowances as `totalAllowances` and individual items in the `allowances` array.

### Requirement 5: Deficit Deduction with Manager Approval
**Objective:** As an admin, I want hour deficit deductions calculated with the correct rounding strategy per region and applied only after manager approval, so that deductions are fair and controlled.

#### Acceptance Criteria
1. When an employee has a deficit (required > worked + leave credits + credited absence), the PayrollService shall calculate the potential deduction as `deficitHours × (monthlySalary / requiredHours)`.
2. The PayrollService shall NOT automatically apply deficit deductions — deductions require manager approval via the flag resolution workflow.
3. When a manager approves a deficit flag, the PayrollService shall apply the deduction. When a manager dismisses a flag, no deduction is applied.
4. When a manager approves a deficit flag with a surplus bank offset (see Requirement 17), the PayrollService shall reduce the deficit by the offset hours before calculating the deduction.
5. Where the employee's region is Nepal, the PayrollService shall apply ceiling rounding (Math.ceil) to the deduction amount.
6. Where the employee's region is Japan, the PayrollService shall apply standard rounding (Math.round) to the deduction amount.
7. The PayrollBreakdown shall show the deficit hours, deduction amount, rounding strategy applied, and approval status (pending/approved/dismissed).

### Requirement 6: Monthly Payroll Report Generation
**Objective:** As an admin, I want a single monthly report aggregating all employees' payroll data, so that I can review and approve payroll for the entire organization.

#### Acceptance Criteria
1. When an admin requests the monthly payroll report for a given yearMonth, the MonthlyPayrollReportService shall generate entries for all active employees in parallel (Promise.all).
2. Each report entry shall include: employee ID, name, employment type, region, hours summary (worked, required, leave credits, credited absence hours, deficit, surplus, overtime, banked surplus used as offset), and full PayrollBreakdown.
3. The report shall include totals: totalWorkedHours, totalRequiredHours, totalOvertimeHours, totalDeficitHours, totalSurplusHours, totalNetAmount, and headcount.
4. If an individual employee's calculation fails (missing salary, policy error), the MonthlyPayrollReportService shall include that employee with an error flag rather than failing the entire report.
5. The MonthlyPayrollReportService shall sort entries by region (JP first, NP second), then by employee name.

### Requirement 7: Transfer Fees and Exchange Rates (Nepal)
**Objective:** As an admin, I want to record transfer fees and JPY→NPR exchange rates for Nepal payments, so that the payroll report shows the true cost of each payment.

#### Acceptance Criteria
1. Where the employee's region is Nepal, the PayrollBreakdown shall include fields for transferFee (NPR) and exchangeRate (JPY/NPR).
2. When an admin enters a transfer fee and exchange rate for a Nepal employee's monthly payroll, the system shall store these values and include them in the breakdown.
3. The PayrollBreakdown shall calculate homeEquivalent as `netAmount × exchangeRate` when an exchange rate is provided.
4. Where the employee's region is Japan, the PayrollService shall set transferFee to 0 and exchangeRate to null (same-currency payment).
5. The transfer fee shall be borne entirely by the company — it shall NOT be deducted from the employee's net amount.

### Requirement 8: Pro-Rata Salary for Partial Months
**Objective:** As an admin, I want pro-rata salary calculation for employees who join or leave mid-month, so that payroll reflects actual calendar days.

#### Acceptance Criteria
1. When an employee's start date falls within the target month, the PayrollService shall calculate pro-rata salary as `baseSalary × (remainingCalendarDays / totalCalendarDays)` and pro-rata hours as `requiredHours × (remainingCalendarDays / totalCalendarDays)`.
2. When an employee's termination date falls within the target month, the PayrollService shall calculate pro-rata salary using days up to and including the termination date.
3. The PayrollBreakdown shall include proRataDays (worked/total) when pro-rata is applied, and null when a full month is worked.

### Requirement 9: RBAC for Payroll and Related Features
**Objective:** As a system administrator, I want all payroll-related actions controlled by role-based permissions, so that employees, managers, and admins each have appropriate access.

#### Acceptance Criteria
1. When an employee requests `GET /api/payroll/:yearMonth`, the API shall return only that employee's own payroll breakdown.
2. When a user with SALARY_MANAGE permission requests `GET /api/payroll-report/:yearMonth`, the API shall return the full monthly payroll report for all employees.
3. If a user without SALARY_MANAGE permission requests the payroll report endpoint, the API shall return 403 Forbidden.
4. When a user with AI_AGENT role requests payroll data, the API shall grant read-only access to all employee payroll data.
5. When a manager requests payroll data, the API shall scope access to their direct reports only.
6. When an employee requests quota redistribution, only a MANAGER or higher role who manages that employee shall be able to approve or reject it.
7. When an employee requests surplus hour banking, only a MANAGER or higher role who manages that employee shall be able to approve and set the maximum banked days.
8. When a manager resolves a deficit flag (approve deduction, dismiss, or apply bank offset), the API shall verify the manager has MANAGER or higher role and manages the affected employee.
9. When an admin triggers salary statement delivery or payroll report export, the API shall require SALARY_MANAGE permission.
10. When an admin records a force majeure event, the API shall require ADMIN or higher role.
11. When an admin calculates termination settlement, the API shall require SALARY_MANAGE permission.
12. When an admin enters transfer fees or exchange rates, the API shall require SALARY_MANAGE permission.

### Requirement 10: Payroll Report Export
**Objective:** As an admin, I want to export the monthly payroll report as CSV, so that I can share it with the accounting team and 社労士 (labor consultant).

#### Acceptance Criteria
1. When an admin clicks the export button on the PayrollReportTab, the system shall generate a CSV file containing all report entries with columns: employee name, employment type, region, worked hours, required hours, overtime hours, base salary, overtime pay, allowances, deductions, net amount, currency.
2. The exported CSV shall use the filename format `payroll-report-{yearMonth}.csv`.
3. The CSV shall include a summary row at the bottom with totals for numeric columns.
4. Where the employee's region is Nepal, the CSV shall include additional columns for exchange rate, transfer fee, and JPY equivalent.

### Requirement 11: Payroll UI — Employee View
**Objective:** As an employee, I want to view my monthly payroll breakdown with clear line items, so that I understand how my pay was calculated.

#### Acceptance Criteria
1. When an employee navigates to the Payroll page, the PayrollPage shall display a month selector defaulting to the current month.
2. The PayrollPage shall display line items: base salary, pro-rata adjustment (if applicable), blending details (if applicable), overtime pay (by category), each allowance, bonus, commission, deficit deduction (with approval status), surplus bank offset applied, transfer fee, and net amount.
3. Where blending occurred, the PayrollPage shall show a blending visualization: old salary × N days + new salary × M days = blended amount.
4. Where the employee's region is Nepal, the PayrollPage shall display the exchange rate badge and JPY equivalent amount.
5. Where a quota redistribution is active for the displayed month, the PayrollPage shall show the adjusted required hours and link to the redistribution plan.
6. While payroll data is loading, the PayrollPage shall display a skeleton loader.
7. If no payroll data exists for the selected month, the PayrollPage shall display an empty state message.

### Requirement 12: Payroll UI — Admin Report View
**Objective:** As an admin, I want a dashboard showing all employees' payroll for a given month with totals, so that I can review and verify before payment.

#### Acceptance Criteria
1. When an admin navigates to the PayrollReportTab, the tab shall display a month selector and a totals summary grid (total worked, total required, total overtime, total net).
2. The PayrollReportTab shall list all employee entries with: name, employment type, region, worked/required hours, overtime hours, deficit/surplus indicators, and net amount.
3. When an admin clicks an employee entry, the PayrollReportTab shall expand to show the full PayrollBreakdown for that employee.
4. The PayrollReportTab shall display a badge count of employees with deficit hours as a warning indicator.
5. The PayrollReportTab shall display a badge count of employees with active quota redistributions.
6. The PayrollReportTab shall include the CSV export button per Requirement 10.
7. While the report is loading, the PayrollReportTab shall display a skeleton loader.

### Requirement 13: Salary Statement Delivery
**Objective:** As an admin, I want to generate and deliver salary statements to employees, so that each employee receives a formal record of their monthly compensation.

#### Acceptance Criteria
1. When an admin triggers salary statement generation for a given month, the system shall produce a per-employee salary statement containing: employee name, employee ID, month, all PayrollBreakdown line items, and company name.
2. The system shall deliver the salary statement via email using the SES email adapter.
3. If email delivery fails for an employee, the system shall log the failure and continue delivering to remaining employees.
4. The salary statement shall be accessible to the employee on their PayrollPage as a downloadable record.

### Requirement 14: PolicyService Caching
**Objective:** As a system, I want policy resolution results cached with a TTL, so that repeated calls to resolveForEmployee during report generation do not trigger redundant DynamoDB queries.

#### Acceptance Criteria
1. The PolicyService shall cache resolved EffectivePolicy per employee with a configurable TTL (default 5 minutes).
2. When resolveForEmployee is called for a cached employee within the TTL window, the PolicyService shall return the cached result without querying DynamoDB.
3. When the TTL expires, the next call to resolveForEmployee shall fetch fresh data from DynamoDB and update the cache.
4. When a policy is updated (company, group, or employee level), the PolicyService shall invalidate all cached entries affected by that change.

### Requirement 15: Audit Trail
**Objective:** As a system administrator, I want all payroll-related actions logged in the append-only audit trail, so that changes are traceable for compliance.

#### Acceptance Criteria
1. When a salary entry is added or modified, the AuditService shall log the action with: actor ID, employee ID, action type, old value, new value, and timestamp.
2. When a monthly payroll report is generated, the AuditService shall log the generation event with: actor ID, yearMonth, employee count, and total net amount.
3. When an admin modifies an employee's allowances, the AuditService shall log the change with before/after values.
4. When a quota redistribution is created, modified, or cancelled, the AuditService shall log the action with: actor ID, employee ID, plan details, and approval status.
5. When a surplus bank entry is created or used as offset, the AuditService shall log the action with: actor ID, employee ID, hours, and expiry date.
6. The audit log shall be immutable — the system shall never update or delete audit entries.

### Requirement 16: Quota Redistribution (Deferred Working Hours)
**Objective:** As an employee, I want to request redistribution of my required hours across two months with manager approval, so that I can work fewer hours one month and compensate the next without salary impact.

#### Acceptance Criteria
1. When an employee requests quota redistribution, the system shall require: the two target months, adjusted hours for each month, and a reason.
2. The system shall validate that total adjusted hours across both months equals the total standard hours (e.g., 140h + 180h = 320h = 2 × 160h) — no net reduction or increase.
3. The quota redistribution request shall require approval from a user with MANAGER role or higher who manages the requesting employee (RBAC-scoped).
4. When a manager approves a quota redistribution, the PayrollService shall use the adjusted hours as the required hours for each target month — no deficit flags fire for the adjusted minimums.
5. The monthly salary shall remain unchanged for both months regardless of the redistributed hours — quota redistribution is a schedule adjustment, not additional work.
6. The quota redistribution must be requested and approved BEFORE the first target month begins. If the first month has already started, the system shall reject the request.
7. When a quota redistribution is active, the employee's dashboard and hours summary shall display the adjusted required hours (not the standard policy hours).
8. The system shall store quota redistribution plans with status (PENDING, APPROVED, REJECTED, CANCELLED) and link them to the affected payroll months.

### Requirement 17: Surplus Hour Banking
**Objective:** As an employee, I want to bank surplus hours as future leave with manager pre-approval, so that extra hours worked are not wasted.

#### Acceptance Criteria
1. When an employee requests surplus banking for a month, the request shall require manager pre-approval BEFORE or DURING the month when surplus is expected.
2. When a manager approves surplus banking, the manager shall specify the maximum number of leave days that can be converted from the surplus.
3. The system shall calculate bankable surplus hours as `min(actualSurplus, maxApprovedDays × hoursPolicy.dailyMinimum)` at month-end.
4. Banked surplus hours shall be usable as leave within 12 months from the banking date — the system shall track expiry dates per bank entry.
5. The system shall send a warning notification 30 days before banked hours expire.
6. When banked surplus hours expire (12 months), the system shall mark them as expired and they shall no longer be available for use.
7. Surplus hours worked WITHOUT prior manager approval for banking shall have zero value — they cannot be banked, offset deficits, or result in additional payment.
8. Where the employee's region is Nepal, the monthly fee is the maximum compensation — surplus hours shall NEVER result in additional payment under any circumstances.

### Requirement 18: Surplus Bank Offset for Deficit Resolution
**Objective:** As a manager, I want to apply an employee's banked surplus hours to offset a deficit in a later month, so that deductions can be avoided when the employee has previously earned surplus.

#### Acceptance Criteria
1. When a manager resolves a deficit flag, the system shall present the option to offset the deficit using the employee's available banked surplus hours.
2. When a manager approves a surplus bank offset, the PayrollService shall reduce the deficit by the offset hours before calculating the deduction: `adjustedDeficit = max(0, deficit - offsetHours)`.
3. The system shall deduct the used hours from the employee's surplus bank balance and record the usage.
4. If a deficit causes a salary deduction in Month N, surplus earned in Month N+1 shall NOT retroactively reverse the Month N deduction — deficit-first-then-surplus has no retroactive reversal.
5. Surplus earned in Month N can offset a deficit in Month N+1 or later (surplus-first-then-deficit), but only with manager approval at flag resolution.
6. Unapproved surplus (not pre-approved for banking) shall NOT be eligible for deficit offset.

### Requirement 19: Termination Settlement
**Objective:** As an admin, I want to calculate final settlement for terminated employees including pro-rata salary, unused leave payout, and deficit adjustments, so that termination payments comply with contract terms.

#### Acceptance Criteria
1. When an employee is terminated, the PayrollService shall calculate final settlement due by the 15th of the month following termination.
2. The final settlement shall include: pro-rata salary for days worked in the final month (per Requirement 8), payout for unused accrued paid leave days at the daily rate (`monthlySalary / requiredDays`), and any deficit deductions (with manager approval).
3. When termination occurs during an active quota redistribution, the PayrollService shall recalculate using STANDARD hours (not redistributed) for the entire plan period up to the termination date.
4. If the employee benefited from reduced hours in a prior redistribution month but has not fulfilled the increased hours in the subsequent month, the PayrollService shall calculate the net shortfall across the entire plan period and deduct it at the hourly rate from the final settlement.
5. The final settlement shall be itemized in the PayrollBreakdown with a SETTLEMENT type flag showing each component.

### Requirement 20: Force Majeure Hours Adjustment
**Objective:** As an admin, I want to credit hours for verified force majeure events, so that employees are not penalized for circumstances beyond their control.

#### Acceptance Criteria
1. When a force majeure event is verified and approved by an admin, the system shall credit the affected hours for the employee — no salary deduction shall apply for force majeure hours.
2. The credited force majeure hours shall be added to the employee's actual hours for payroll calculation purposes.
3. If a force majeure event persists for more than 30 days, either party may terminate with 7 days written notice per policy.
4. The PayrollBreakdown shall show force majeure credited hours as a separate line item.

### Requirement 21: Policy-Driven Configuration (No Hardcoding)
**Objective:** As a system architect, I want all payroll rules configurable via the policy cascade, so that changing business rules never requires code changes.

#### Acceptance Criteria
1. The following values shall be read from the employee's resolved policy, never hardcoded: daily/weekly/monthly minimum hours, overtime rates and thresholds, deemed overtime hours, leave accrual rate and cap, probation duration and leave rules, deficit rounding strategy, surplus banking expiry period (default 12 months), maximum banked surplus days, allowance types and defaults, bonus schedule, salary review interval, payment deadline (default: 15th of following month), notice period duration, and quota redistribution eligibility.
2. When any policy value is missing from the employee/group/company level, the PolicyService shall fall back through the cascade to the region default.
3. When a new policy field is added, the system shall require a corresponding entry in the region defaults so that the cascade always resolves to a value.
4. The policy editor UI shall expose all payroll-related policy fields with descriptions from i18n.
