# Database Design

## Principles
- SQLite
- migrations required
- integer cents for money
- no PHI fields
- aggregate operational data only

## Table: app_settings
Single row.

Fields:
- id
- practice_name
- currency
- planning_basis (`expected` | `collected`)
- target_clinical_days_per_week
- max_completed_visits_per_day
- weekly_patient_goal
- monthly_patient_goal
- weekly_new_patient_goal
- monthly_new_patient_goal
- weekly_revenue_goal_cents
- monthly_revenue_goal_cents
- annual_revenue_goal_cents
- green_threshold_percent
- yellow_threshold_percent
- forecast_lookback_weeks
- backup_folder
- auto_backup_frequency
- inactivity_lock_minutes
- theme
- created_at
- updated_at

## Table: weekday_settings
- weekday (1-7)
- enabled
- display_order

## Table: visit_types
Seed rows:
- new_psych_eval
- followup_med
- therapy_med
- therapy_only
- other

Fields:
- id
- code unique
- display_name
- enabled
- default_billed_cents
- default_expected_cents
- sort_order
- created_at
- updated_at

## Table: daily_stats
One row per date.

Fields:
- id
- date unique
- scheduled_count
- cancellation_count
- no_show_count
- gross_billed_cents
- expected_allowed_cents
- insurance_paid_cents
- patient_paid_cents
- other_paid_cents
- adjustments_cents
- refunds_cents
- business_note nullable
- created_at
- updated_at

Constraints:
- all counts >= 0
- all money >= 0
- business_note max length and warning: no patient information
- completed count must not exceed scheduled unless user explicitly confirms an override

## Table: daily_visit_counts
- id
- daily_stats_id FK
- visit_type_id FK
- count
- unique(daily_stats_id, visit_type_id)

## Table: backups
- id
- created_at
- path
- file_size
- checksum
- backup_type (`manual` | `automatic`)
- verification_status

## Table: import_runs
- id
- source_filename
- started_at
- completed_at
- status
- rows_seen
- rows_imported
- rows_rejected
- error_report_path nullable

## Table: schema_migrations
Managed by ORM migration tooling.

## Derived values
Do not persist unless there is a demonstrated need:
- completed visits
- net collected
- outstanding
- rates
- averages
- goal percentages
- trend labels
- forecasts

Derive them from source values to avoid drift.
