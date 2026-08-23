# Software Requirements Specification

## 1. Product
**Name (working):** Practice Analytics Desktop

**Owner type:** Single-member LLC / solo psychiatric practice

**Primary user:** One practice owner

**Platform:** Windows desktop

**Data classification:** Aggregate business statistics; application is specifically designed to avoid patient-identifying information and clinical PHI.

## 2. Core user workflow
At the end of a clinical day, the user opens a single Daily Entry form and enters aggregate counts and financial totals. The app calculates daily, weekly, monthly, quarterly, and yearly metrics automatically.

## 3. Visit categories
All categories must be supported and editable/enabled in Settings:

1. New psychiatric evaluation
2. Follow-up medication management
3. Therapy + medication management
4. Therapy only
5. Other completed visit
6. Cancellation
7. No-show

Completed categories contribute to completed-visit counts. Cancellation and no-show do not.

## 4. Daily entry
For each date, allow:
- scheduled appointments
- count by visit category
- cancellations
- no-shows
- optional aggregate administrative/other completed visits
- billed amount
- expected allowed/reimbursable amount
- insurance payments received
- patient/self-pay payments received
- other payments received
- adjustments/write-offs
- refunds
- optional non-PHI business note such as "office closed early" or "holiday week"

Derived fields:
- completed visits
- completion rate
- cancellation rate
- no-show rate
- gross billed
- total collected
- outstanding amount
- average billed per completed visit
- average collected per completed visit

## 5. Revenue definitions
Store and show these separately:

### Gross billed
Total amount submitted/charged.

### Expected/allowed
Expected collectible amount after contractual adjustments where known.

### Insurance paid
Amount received from insurers.

### Patient paid
Copays, deductibles, coinsurance, self-pay, and direct patient payments entered in aggregate.

### Other paid
Any non-insurance/non-patient revenue category the user chooses to record.

### Adjustments/write-offs
Contractual or administrative reductions.

### Refunds
Money returned.

### Net collected
`insurance_paid + patient_paid + other_paid - refunds`

### Outstanding
Default:
`max(expected_allowed - net_collected - adjustments, 0)`

Settings must permit the user to choose whether planning uses:
- expected/allowed revenue, or
- actual collected revenue.

## 6. Settings
A Settings page must allow configuration of:
- practice display name
- enabled weekdays
- target clinical days per week
- maximum desired completed visits per day
- default fee/expected value for each completed visit type
- weekly patient goal
- monthly patient goal
- weekly new-patient goal
- monthly new-patient goal
- weekly revenue goal
- monthly revenue goal
- annual revenue goal
- planning basis: expected or collected
- traffic-light thresholds
- forecast lookback window
- backup folder
- automatic backup frequency
- currency (USD for v1)
- date format
- theme preference

No important financial value should be hard-coded.

## 7. Dashboard
Dashboard must show at minimum:

### Today/current period
- patients today
- patients this week
- patients this month
- new patients this week
- new patients this month
- follow-ups this week
- follow-ups this month

### Financial
- billed this month
- expected/allowed this month
- insurance paid this month
- patient paid this month
- total collected this month
- outstanding this month
- monthly revenue goal progress
- annual revenue goal progress

### Operations
- cancellation rate
- no-show rate
- schedule utilization
- average completed visits per clinical day
- remaining capacity

### Trends
- volume trend
- new-patient trend
- revenue trend
- busiest weekday
- slowest weekday
- top 3 detected insights

## 8. Weekly / monthly / quarterly / annual summaries
Each period must show:
- scheduled appointments
- completed visits
- new patients
- follow-up med visits
- therapy + med visits
- therapy-only visits
- other visits
- cancellations
- no-shows
- average visits per clinical day
- new-patient percentage
- follow-up percentage
- completion rate
- cancellation rate
- no-show rate
- billed
- expected/allowed
- insurance paid
- patient paid
- other paid
- refunds
- adjustments
- net collected
- outstanding
- revenue goal
- revenue goal %
- visit goal
- visit goal %
- period-over-period change

## 9. Revenue planner
User enters or selects a target:
- weekly revenue
- monthly revenue
- annual revenue

The planner must calculate:
- current projected revenue
- revenue gap
- average expected/collected revenue per completed visit
- approximate additional completed visits required
- additional visits per week
- additional visits per clinical day
- alternative visit mixes using configured visit-type values

Example output:
"At your current visit mix, approximately 29 additional completed visits this month are needed to reach the selected goal."

Alternative mix examples should be mathematical suggestions, not clinical scheduling advice.

## 10. Capacity
User can define:
- workdays
- maximum desired completed visits/day

Calculate:
- theoretical weekly capacity
- theoretical monthly capacity
- schedule utilization %
- unused visit capacity
- estimated revenue at capacity

## 11. Pattern detection
Automatically identify:
- busiest weekday
- slowest weekday
- increasing/decreasing completed volume
- increasing/decreasing new-patient volume
- increasing/decreasing follow-up volume
- cancellation changes
- no-show changes
- revenue changes
- collection mix changes (insurance vs patient)
- underutilized days
- unusually high/low weeks
- repeated goal misses
- capacity pressure

Use deterministic statistical rules for v1. Do not require external AI APIs.

## 12. Forecasting
Provide forecasts for:
- next 4 weeks completed visits
- next month new patients
- next month total collected
- next month expected/allowed revenue

Forecasts must:
- use local historical data only
- show lookback window
- show a simple confidence/quality indicator
- be labeled "Forecast"
- never be presented as guaranteed

## 13. Reports
### Excel/CSV
Export filtered data and period summaries.

### PDF
Generate monthly and annual business reports with:
- KPIs
- charts
- visit mix
- payment mix
- goal performance
- detected trends
- forecast section

## 14. Import
Support CSV/Excel import for historical aggregate data.
Requirements:
- preview before import
- map columns
- validate dates and money
- reject duplicate dates or allow explicit merge behavior
- show error report
- never silently overwrite existing data

## 15. Authentication
Single-user password protection.
- first-run password creation
- local-only authentication
- password change workflow
- inactivity lock setting
- no password recovery through email in v1

Provide a recovery-code or reset-file strategy that does not expose stored data without user confirmation.

## 16. Backup
- manual backup
- scheduled local backup
- backup to a user-selected folder
- backup verification
- restore preview
- restore confirmation
- preserve multiple dated backups
- never overwrite the only known good backup

## 17. Accessibility / usability
- keyboard-friendly forms
- clear focus states
- scalable text
- no critical information conveyed only by color
- plain-English error messages
- confirmation for destructive operations

## 18. Out of scope for v1
- patient scheduling
- EHR/EMR
- prescribing
- clinical documentation
- claims submission
- payer portals
- patient identifiers
- staff multi-user accounts
- cloud sync
- mobile app
- insurer-level patient claims reconciliation
