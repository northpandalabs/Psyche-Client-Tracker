# UI Specification

## Navigation
Left navigation:
1. Dashboard
2. Daily Entry
3. Weekly
4. Monthly
5. Analytics
6. Revenue Planner
7. Reports
8. Import / Export
9. Backup / Restore
10. Settings

## Dashboard
Top row KPI cards:
- Patients This Week
- Patients This Month
- New Patients This Month
- Follow-Ups This Month
- Collected This Month
- Monthly Goal %

Second row:
- Insurance Paid
- Patient Paid
- Outstanding
- Cancellation Rate
- No-Show Rate
- Schedule Utilization

Charts:
- completed visits by week
- new vs follow-up by month
- collected revenue vs goal
- average completed visits by weekday
- insurance vs patient payment mix

Insights card:
Top 3 deterministic insights with plain-English explanation.

## Daily Entry
Date picker defaults to today.

Section: Appointments
- Scheduled
- New psychiatric evaluations
- Follow-up medication management
- Therapy + medication management
- Therapy only
- Other
- Cancellations
- No-shows

Show automatically:
- Completed visits
- Completion rate

Section: Financials
- Gross billed
- Expected/allowed
- Insurance paid
- Patient paid
- Other paid
- Adjustments/write-offs
- Refunds

Show automatically:
- Net collected
- Outstanding

Optional business note:
Display warning directly above:
"Do not enter patient names or other patient-identifying information."

Buttons:
- Save
- Save & Add Another Date
- Cancel

If date already exists, load existing values and clearly label "Editing existing day."

## Weekly / Monthly screens
Period picker.
KPI cards.
Visit mix table.
Payment mix.
Goal progress.
Comparison to prior period.
Charts.
Detected insights.

## Revenue Planner
Inputs:
- target period
- target revenue
- planning basis
- clinical days/week
- max visits/day
- optional custom visit mix

Outputs:
- current projection
- gap
- visits needed
- visits/week
- visits/clinical day
- capacity feasibility
- 3 alternative visit mixes

## Analytics
Filters:
- date range
- weekdays
- visit types

Sections:
- volume
- growth
- scheduling efficiency
- revenue
- collections
- capacity
- detected patterns
- forecast

## Settings
Tabs:
- Practice
- Visit Types & Fees
- Goals
- Schedule & Capacity
- Analytics
- Security
- Backup
- Appearance

## First run
Wizard:
1. Create password.
2. Practice display name.
3. Choose workdays.
4. Max visits/day.
5. Visit-type default values.
6. Revenue goals.
7. Backup folder.
8. Finish.

No PHI should ever be requested.
