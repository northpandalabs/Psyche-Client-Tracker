# Analytics and Financial Rules

## Core calculations

### Completed visits
Sum counts of all enabled completed visit types.

### Completion rate
`completed_visits / scheduled_count`
Return null when scheduled_count is zero.

### Cancellation rate
`cancellations / scheduled_count`

### No-show rate
`no_shows / scheduled_count`

### Net collected
`insurance_paid + patient_paid + other_paid - refunds`

### Outstanding
`max(expected_allowed - net_collected - adjustments, 0)`

### Average collected per completed visit
`net_collected / completed_visits`

### Average expected per completed visit
`expected_allowed / completed_visits`

### Schedule utilization
For a period:
`completed_visits / (enabled_clinical_days_in_period * max_completed_visits_per_day)`

## Revenue goal math
Goal progress:
`selected_period_revenue / selected_goal`

Revenue gap:
`max(goal - projected_or_current_revenue, 0)`

Visits required:
`ceil(revenue_gap / average_revenue_per_completed_visit)`

If fewer than 10 completed historical visits exist, use configured visit-type expected values rather than claiming the historical average is reliable.

## Visit mix
Calculate percentage of completed visits by visit type.

## Busiest/slowest weekday
Only include enabled weekdays with at least 3 observed dates unless user selects "include limited data."

Rank by average completed visits per observed working day.

## Trend rule v1
Default comparison:
- recent 4 weeks vs previous 4 weeks
- require sufficient data

Trend thresholds:
- >= +10%: increasing
- <= -10%: decreasing
- otherwise stable

Make threshold configurable later.

## Unusual week
Use robust z-score or IQR rule once at least 12 weeks exist.
Before that, do not claim an anomaly; use simple comparison language.

## Pattern alerts
Examples:
- "New-patient volume is down 18% over the last 4 weeks compared with the prior 4 weeks."
- "Fridays average 34% fewer completed visits than your overall clinical-day average."
- "Your no-show rate has risen from 5.2% to 8.1%."
- "Insurance payments represent 71% of collections this month."
- "At your configured capacity, the current monthly revenue goal is not feasible using your recent average revenue per visit."

## Forecast v1
Use simple, explainable forecasting.

Preferred:
- rolling weekly averages with optional linear trend
- seasonal weekday pattern where data is sufficient

Minimum data:
- do not produce meaningful trend forecast with fewer than 4 weeks
- mark quality "Limited" with < 8 weeks
- "Moderate" with 8-25 weeks
- "Better historical basis" with 26+ weeks

Forecast should display:
- forecast value
- historical lookback
- quality label
- disclaimer that it is an estimate

## Revenue planner alternative mixes
Given remaining revenue gap and configured expected values:
- calculate several integer combinations of visit types
- optimize first for fewest additional visits
- also show a mix close to recent historical visit mix
- also show a follow-up-heavy scenario

Do not imply clinical appropriateness. Label as business-planning scenarios only.
