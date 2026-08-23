# Codex Build Task — Version 1

Implement the Practice Analytics Desktop application described in this repository.

Read `AGENTS.md` and every document in `docs/` before editing code.

## Objective
Deliver a usable Windows desktop MVP for a single practice owner.

## Milestone 1 — Foundation
- Electron + React + TypeScript + Vite
- secure preload bridge
- SQLite + migrations
- first-run setup
- password lock
- navigation shell
- settings persistence

## Milestone 2 — Daily operations
- Daily Entry form
- visit-type counts
- appointment totals
- financial totals
- edit existing day
- validation
- persistence

## Milestone 3 — Dashboard and summaries
- dashboard KPIs
- weekly view
- monthly view
- charts
- goal progress

## Milestone 4 — Revenue planner
- revenue target
- revenue gap
- visits required
- visits/week and visits/day
- capacity check
- alternative visit mixes

## Milestone 5 — Analytics
- weekday analysis
- 4-week trend comparisons
- cancellation/no-show trends
- collection mix
- capacity utilization
- deterministic insight engine
- simple labeled forecast

## Milestone 6 — Data portability
- CSV export
- Excel export
- PDF monthly report
- import preview + validation
- local backup/restore

## Milestone 7 — Quality
- unit tests
- integration tests
- core e2e tests
- lint/typecheck/build clean
- accessible empty/error states
- production packaging configuration

## Required acceptance criteria
1. User can install/run the app locally.
2. User can create a password on first run.
3. User can enter aggregate data for a date.
4. Data remains after application restart.
5. User can edit a previously entered date.
6. Dashboard correctly summarizes current week and month.
7. New and follow-up visits are reported separately.
8. Insurance and patient payments are reported separately.
9. Revenue planner responds to configured goals and visit-type values.
10. No PHI fields exist.
11. Exports and backups work.
12. All key financial calculations have automated tests.
13. Renderer has no unrestricted Node access.
14. README contains exact development and Windows build steps.

## Seed/demo data
Create a demo-data generator that uses synthetic aggregate numbers only.
Do not include fake patient names because the product should not normalize storing patient-level data.

## Completion report
At the end, provide:
- files changed
- architecture decisions
- database migration list
- tests run and results
- build result
- known limitations
- exact command to create Windows installer
