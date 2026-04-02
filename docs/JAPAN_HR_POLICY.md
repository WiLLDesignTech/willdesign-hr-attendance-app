# WillDesign Japan-Side HR Policy

## Company Information

- **Company**: WillDesign KK/GK (Japan-registered)
- **本社**: 〒153-0044 東京都目黒区大橋２丁目２２−１２
- **オフィス**: 〒150-0043 東京都渋谷区道玄坂２丁目６−１７ 12階
- **Team Size**: Up to 10 members (scalable)
- **CEO**: Sanjay Bhandari

---

## 1. Employment Types (Japan Side)

### 1.1 Full-Time Employee (正社員)
- Permanent employment contract
- Standard Japanese labor law applies (労働基準法)
- Social insurance (社会保険) required: 健康保険, 厚生年金, 雇用保険, 労災保険
- Currently outsourced to 社労士 (labor consultant)
- Eligible for bonuses, full benefits

### 1.2 Contract Employee (契約社員)
- Fixed-term employment contract
- Renewable, subject to 5-year rule (無期転換ルール)
- Same labor law protections as 正社員
- Benefits may differ per contract terms

### 1.3 業務委託 (Gyoumu Itaku / Outsourced Contractor)
- Independent contractor, similar to Nepal-side arrangement
- No labor law protections (not an employee)
- No social insurance from company
- Contractor handles own taxes
- Payment terms defined per contract

### 1.4 Part-Time Employee (パートタイム)
- Reduced hours compared to full-time
- Pro-rata benefits based on hours/days worked
- Subject to パートタイム・有期雇用労働法
- Social insurance applies if working >20h/week (2024 rule for companies with 51+ employees) or >30h/week (general rule)

### 1.5 Sales (with Commission)
- Can be any employment type (full-time, contract, part-time)
- Base salary + commission component
- Commission is calculated externally and input as a final amount
- Commission timing is configurable (monthly, quarterly, etc.)

### 1.6 Intern
- Paid or unpaid
- Tracked hours regardless of pay status
- May receive stipend (configurable)
- Limited scope of work

---

## 2. Work Arrangements

### 2.1 Location Types
- **Office-based (出社)**: Work from Shibuya office
- **Remote (リモート)**: Work from home or any location
- **Hybrid (ハイブリッド)**: Mix of office and remote days

### 2.2 Time Types
- **Fixed time (固定時間)**: Set start/end times (e.g., 9:00-18:00)
- **Flex time (フレックスタイム)**: Core hours + flexible start/end
- **Full flex (フルフレックス)**: No core hours, results-based

### 2.3 Standard Working Hours
- 8 hours/day, 40 hours/week (Japanese labor law standard)
- Configurable per company → group → employee level
- Work arrangement (location type + time type) is assignable per employee

---

## 3. Overtime Rules (残業)

### 3.1 みなし残業 (Deemed/Fixed Overtime)
- Company-wide default: 45 hours included in base salary
- Configurable per company → group → employee level
- When actual overtime exceeds the deemed hours, excess is paid at overtime rates
- Must be clearly stated in employment contract

### 3.2 Overtime Pay Rates (Japanese Labor Law)
- Regular overtime (法定外労働): 1.25x base hourly rate
- Late night work (深夜労働, 22:00-05:00): additional 0.25x (total 1.5x if also overtime)
- Holiday work (法定休日労働): 1.35x base hourly rate
- Overtime exceeding 60 hours/month: 1.5x base hourly rate
- These are legal minimums; company may offer higher rates

### 3.3 36 Agreement (三六協定)
- Required for any overtime beyond 40h/week
- Filed with labor standards office (労働基準監督署)
- Limits: 45h/month, 360h/year (general), special provisions for temporary increases
- The system must track overtime hours against these limits

### 3.4 Overtime Configuration
- Some employees have overtime pay (実費残業)
- Some employees have deemed overtime included (みなし残業)
- Configuration follows cascade: company → group → employee
- The system tracks actual overtime hours regardless of payment type

---

## 4. Compensation

### 4.1 Salary Structure
- **Monthly salary (月給)**: Configurable per employee
- **Annual salary (年俸)**: Alternative, divided into monthly payments
- **Bonus (賞与)**: Configurable timing
  - Default: Twice a year (specific months configurable)
  - UI options: twice a year with month selection, custom schedule
  - If not configured per employee → falls back to group → company level
- **Commission**: Calculated externally, input as final amount
- **Currency**: JPY for Japan team, NPR for Nepal team

### 4.2 Allowances (手当)
All configurable per company → group → employee level:
- **通勤手当 (Transportation)**: Commute costs
- **住宅手当 (Housing)**: Housing support
- **役職手当 (Position allowance)**: Management/role premium
- **その他 (Others)**: Any custom allowance types (configurable by admin)

### 4.3 Deductions
- Social insurance (社会保険) — outsourced to 社労士 for now, app tracks hours only
- Phase 2: App will handle deduction calculations
- Income tax withholding (源泉徴収) — handled externally for now
- Phase 2: App will generate 給与明細 (pay slips)

---

## 5. Leave Policy (有給休暇)

### 5.1 Japanese Standard Paid Leave (法定有給休暇)
Following Japanese labor law defaults (configurable per company → group → employee):

| Tenure | Days Granted |
|--------|-------------|
| 6 months | 10 days |
| 1.5 years | 11 days |
| 2.5 years | 12 days |
| 3.5 years | 14 days |
| 4.5 years | 16 days |
| 5.5 years | 18 days |
| 6.5+ years | 20 days |

- Part-time employees: pro-rata based on scheduled days (比例付与)
- Unused leave carries over for 2 years (時効: 2年)
- Employer must ensure at least 5 days taken per year (年5日取得義務)

### 5.2 Other Leave Types (Configurable)
- 慶弔休暇 (Congratulations/condolence leave)
- 産休・育休 (Maternity/paternity leave)
- 介護休暇 (Nursing care leave)
- 生理休暇 (Menstrual leave)
- Company-specific special leave

### 5.3 Leave Approval
- Same workflow as Nepal side: Employee requests → Manager approves/rejects
- Tracked in the system with approval audit trail
- Both Japan and Nepal teams use the same leave tracking system with different policy configurations

---

## 6. Probation Period (試用期間)

- Company-wide default: 3 months
- Configurable per company → group → employee level
- During probation:
  - Shorter notice period may apply
  - Leave accrual may be different (configurable)
  - Performance review at end of probation

---

## 7. Holidays (祝日)

### 7.1 Japan National Holidays
Fixed calendar, editable by admin:
- 元日 (New Year's Day) — January 1
- 成人の日 (Coming of Age Day) — 2nd Monday of January
- 建国記念の日 (National Foundation Day) — February 11
- 天皇誕生日 (Emperor's Birthday) — February 23
- 春分の日 (Vernal Equinox Day) — ~March 20
- 昭和の日 (Showa Day) — April 29
- 憲法記念日 (Constitution Day) — May 3
- みどりの日 (Greenery Day) — May 4
- こどもの日 (Children's Day) — May 5
- 海の日 (Marine Day) — 3rd Monday of July
- 山の日 (Mountain Day) — August 11
- 敬老の日 (Respect for the Aged Day) — 3rd Monday of September
- 秋分の日 (Autumnal Equinox Day) — ~September 23
- スポーツの日 (Sports Day) — 2nd Monday of October
- 文化の日 (Culture Day) — November 3
- 勤労感謝の日 (Labor Thanksgiving Day) — November 23

振替休日 (substitute holiday): When a holiday falls on Sunday, the following Monday is a holiday.

### 7.2 Nepal Holidays (for Nepal team)
Manually managed by admin (volatile/changing yearly):
- Dashain (दशैँ) — ~October, multiple days
- Tihar (तिहार) — ~October/November, multiple days
- Shivaratri (शिवरात्रि) — ~February/March
- Teej (तीज) — ~August/September
- Other holidays added by admin as needed each year

### 7.3 Holiday Calendar Management
- Each team/group has its own holiday calendar
- Admin can add/remove/edit holidays
- RBAC controls who can manage holiday calendars
- Holidays affect hour requirement calculations (reduce required hours)

---

## 8. Roles (Editable for Both Teams)

### Japan Side
- Sales (営業)
- Customer Success (カスタマーサクセス)
- Intern (インターン)
- Full-Time Developer (正社員エンジニア)
- Contract Developer (契約社員エンジニア)
- Part-Time (パートタイム)
- 業務委託 (Outsourced Contractor)

### Nepal Side
- Full-Time Contract Developer
- Paid Contract Intern
- Unpaid Intern (hours tracked, no pay, optional stipend)
- Team Lead
- CTO

### Role Management
- All roles are editable by admin
- Roles map to policy groups for hour/leave/compensation rules
- New roles can be created as the organization grows
- Future: Full-time permanent employee, part-time employee types for Nepal

---

## 9. Reporting & Task Tracking (Both Teams)

### 9.1 Daily Reports via Slack
- Users send report messages in designated Slack channels
- Bot parses and logs the report
- Report format encouraged: yesterday's work, today's plan, blockers
- Users should mention: repository name, JIRA ticket IDs, GitHub PR numbers
- Bot gives hint/warning if JIRA tickets or repo+PR references are missing
- No AI processing — just pattern matching for references

### 9.2 Report Editing
- Users can edit their Slack message to update the report
- System keeps append-only log of all versions (original + edits)
- Each version timestamped with edit reason
- Append-only design enables future LLM analysis

### 9.3 Reference Tracking
- Extract JIRA ticket IDs from reports (regex: JIRA-\d+, PROJECT-\d+)
- Extract GitHub references (repo + PR: e.g., "willdesign-hr#42")
- Warn if report has no JIRA or GitHub references
- Store references as structured data alongside report text
- Future: Claude/AI verification of report vs actual JIRA/GitHub activity

---

## 10. Multi-Region Considerations

### 10.1 Timezone Handling
- Japan team: JST (UTC+9) — same as current system
- Nepal team: NPT (UTC+5:45)
- All timestamps stored in UTC, displayed in user's local timezone
- "Today" and "this week" calculated per user's timezone

### 10.2 Currency
- Japan team: JPY (Japanese Yen)
- Nepal team: NPR (Nepalese Rupee)
- No currency conversion in the system — each operates independently

### 10.3 Same Slack Bot, Different Channels
- Single Slack bot serves both teams
- Different attendance channels per team/group
- Bot access configured manually per channel
- Channel-to-group mapping in system configuration
