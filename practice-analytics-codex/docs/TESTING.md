# Testing Plan

## Unit tests
Required for:
- net collected
- outstanding
- all rates
- goal percentage
- visits needed
- capacity
- revenue-at-capacity
- period aggregation
- visit mix
- weekday averages
- trend classification
- anomaly rule
- forecast behavior
- money rounding
- zero denominators

## Boundary cases
Test:
- zero scheduled
- zero completed
- refunds greater than current-period receipts
- expected allowed below collected
- adjustments greater than outstanding
- one working day/week
- seven working days/week
- goal = 0
- empty database
- only one week of data
- duplicate date import
- leap year
- month boundaries
- year boundaries

## Integration tests
- create daily stats
- edit daily stats
- aggregate weekly/monthly
- update settings and recalculate
- backup and verify
- restore into temporary DB
- CSV import preview
- CSV import validation
- export generation

## UI tests
Critical paths:
1. first-run setup
2. unlock
3. enter a day
4. edit a day
5. view dashboard
6. change visit fee
7. run revenue planner
8. export a month
9. create backup
10. restore backup

## Acceptance
No release until:
- TypeScript passes
- unit tests pass
- build succeeds
- app launches in packaged or production-like mode
- database migration from prior schema succeeds
- daily entry survives restart
