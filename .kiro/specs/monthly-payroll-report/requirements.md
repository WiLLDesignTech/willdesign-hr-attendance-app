# Requirements Document

## Project Description (Input)
Monthly Payroll Report with Policy Engine: A comprehensive monthly report per employee that ties together attendance hours, leave, absences, salary, and policy configurations to calculate the final payroll.

**Policy Cascade (prerequisite):** 3-level policy system (Company → Group → Employee) governing:
- Hours policy: daily/weekly/monthly required hours, work arrangement, core hours
- Leave policy: accrual schedule, caps, carry-over, leave types, mandatory usage (JP 5-day rule)
- Overtime policy: deemed hours (みなし残業), pay rates (1.25x/1.35x/1.5x), 36 Agreement limits
- Compensation policy: salary type (monthly/annual/hourly), bonus schedule, allowance types, commission
- Probation policy: duration, leave rules, notice period
- Flag policy: deficit thresholds, resolution options
- Payment policy: deadlines, salary statement schedule

**Salary History:** Recording salary changes with effective dates and change types (INITIAL, REVIEW, PROMOTION, ADJUSTMENT, PROBATION_END) so mid-month changes are handled via blended calculation. Admin UI to update salary with effective date.

**Report Calculation:** Required hours (from policy + holidays + quotas) vs actual hours worked (from attendance events), paid leave credits, unpaid absences, deficit/surplus hours, overtime, and pro-rata salary. Output: transparent payroll breakdown showing base salary, pro-rata adjustments, overtime pay, allowances, deficit deductions, and net amount.

**Region-specific rules:** Japan (labor law overtime rates, mandatory 5-day leave, yen rounding) and Nepal (ceil rounding for deductions, NPR/JPY exchange rate, transfer fees).

**RBAC:** Employees see own report, managers see team reports, admins see all. AI_AGENT role has read-only access.

## Requirements
<!-- Will be generated in /kiro:spec-requirements phase -->
