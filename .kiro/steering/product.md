# Product Context — WillDesign HR Platform

## What Is This?
A full-stack HR management platform for WillDesign KK/GK serving two teams:
- **Japan team** (~10 members): employees, contractors, part-time, sales, interns — Japanese labor law
- **Nepal team** (~15 members): independent contractors, paid/unpaid interns — Nepal Contract Act 2056

Replaces the existing Google Apps Script Slack bot with a proper web application backed by AWS, while keeping Slack as the primary daily interface (Kincone-style message-based attendance + daily reporting).

## Who Uses It?
- **All team members (Japan + Nepal)**: Clock in/out via Slack messages, submit daily reports via Slack, view dashboard on web
- **Managers**: Approve leave, resolve flags, view team data, manage quotas — scoped to direct reports
- **Admins/HR**: Full access, policy management, onboarding/offboarding, payroll, holiday calendars
- **CEO (Super Admin)**: Override any restriction, full organizational visibility

## Core Problems Solved
1. No proper database (currently Google Sheets)
2. No web UI for management/editing
3. Japan team has no HR system at all — different labor laws, overtime, social insurance
4. Slash commands feel unnatural vs Kincone-style message-based attendance
5. No scalable permission system (RBAC + ABAC needed)
6. No policy flexibility for different employment types and regions
7. Daily reports not tracked systematically, no JIRA/GitHub reference validation
8. No append-only audit trail for future LLM analysis

## Key Principles
1. **Slack is primary** for daily attendance + reporting (message-based, not commands)
2. **Web app is the management layer** — editing, dashboards, admin, policy builder
3. **Policy-as-data with cascade** — company → group → employee, static files first, DB later
4. **Everything configurable** — employment types, overtime rules, leave, bonuses, allowances, probation, holidays
5. **Append-only logging** — all user activity stored for audit trail and future LLM analysis
6. **No AI in v1** — hints and warnings from bot, but no Claude/AI backend processing
7. **Free/cheap deployment** — AWS free tier, ~$0-5/month
8. **TDD** — test-driven development, tests first
9. **Monorepo** — single repo, GitHub Actions CI/CD, dev + prod
10. **Single-tenant** — WillDesign only, not SaaS

## Two-Region Context

### Japan (Japanese Labor Law — 労働基準法)
- Employment types: 正社員, 契約社員, 業務委託, パートタイム, Sales, Intern
- Overtime: みなし残業 (deemed, e.g. 45h included) or actual overtime pay (1.25x/1.35x/1.5x)
- 36 Agreement tracking (45h/month, 360h/year limits)
- Leave: Japanese standard (10 days at 6 months, scaling to 20), 2-year carry-over, 5-day mandatory
- Social insurance: outsourced to 社労士, system tracks hours only (phase 2: deductions)
- Salary: JPY, monthly or annual, bonuses (configurable timing), commission for sales
- Allowances: transportation, housing, position, custom
- Holidays: Japanese national holidays (seeded, editable)
- Office: Shibuya, supports office/remote/hybrid

### Nepal (Nepal Contract Act 2056)
- All members are independent contractors (not employees)
- Types: Full-Time (160h/mo), Paid Intern (80h/mo), Unpaid Intern (tracked hours, no pay)
- No statutory benefits (provident fund, gratuity, social security)
- Leave: 1 day/month after 3-month probation, cap 20, forfeit on termination
- Salary: NPR via Wise by 15th, company covers transfer fees
- Tax: 5% flat on foreign income, contractor files own taxes
- Holidays: manually managed (Dashain, Tihar, Shivaratri, Teej, volatile yearly)
- Remote work arrangement

## Brand Identity (from willdesign-tech.com)

### Company
- **Name**: WiLL Design (stylized with capital L)
- **Tagline**: "Good Design — Flexible — Reasonable"
- **Mission**: "Make IT development more accessible by realizing ideas overflowing in society"
- **Website**: willdesign-tech.com

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#000000` | Text, buttons, headings |
| Accent | `#58C2D9` | Interactive elements, highlights, links |
| Accent Light | `#6DD9EC` | Gradient end, hover states |
| Turquoise | `#40DEC5` | Success states, positive indicators |
| Periwinkle | `#73A5DC` | Info states, secondary highlights |
| Lavender | `#8C89E8` | Charts, data visualization |
| Pink/Magenta | `#E2498A` | Warnings, errors, alerts, destructive actions |
| Sky Blue | `#4BB8DF` | Hover states |
| Purple | `#5636D1` | Focus states |
| Background | `#FFFFFF` | Page background |
| Dark Gray | `#32373C` | Secondary text |
| Medium Gray | `#888888` | Muted text, placeholders |
| Light Gray | `#DDDDDD` | Borders |
| Shadow Gray | `#D9D9D9` | Shadows, dividers |

### Typography
- **Headings**: "Silom", sans-serif (bold)
- **Body**: System sans-serif stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)

### Design Aesthetic
- Light, modern, minimalist with high contrast (black/white + cyan accents)
- Clean card-based layouts with generous whitespace
- Smooth 150ms transitions on interactive elements
- Accent gradient: `linear-gradient(0deg, #58C2D9 24%, #6DD9EC 93%)`
- Professional feel — subtle border radii (4-12px), no over-rounded elements

### Logo
- File: `will-design-logo.png`
- Placement: top-left of sidebar/header navigation
- Links to dashboard when clicked
