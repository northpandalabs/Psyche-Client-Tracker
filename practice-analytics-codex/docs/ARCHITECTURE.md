# Architecture

## 1. Overview
Local-first Windows desktop app.

```text
+-----------------------------+
| Electron Renderer           |
| React + TypeScript          |
| Dashboard / Forms / Charts  |
+-------------+---------------+
              |
        secure preload API
              |
+-------------v---------------+
| Electron Main Process       |
| Application Services        |
| Validation / Reports        |
| Backup / Import / Export    |
+-------------+---------------+
              |
+-------------v---------------+
| SQLite                      |
| Local application database  |
+-----------------------------+
```

## 2. Technology choices
### Desktop shell
Electron

### UI
React + TypeScript + Vite

### Database
SQLite

### ORM
Drizzle ORM preferred.

### Validation
Zod.

### Charts
Recharts.

### Testing
Vitest for domain/unit tests.
React Testing Library for components.
Playwright for desktop/e2e where practical.

### Packaging
electron-builder for Windows installer.

## 3. Security boundary
Renderer must never receive unrestricted filesystem/database access.

Use:
- `contextIsolation: true`
- `nodeIntegration: false`
- narrow typed preload bridge
- Zod schemas on every IPC payload
- allowlist IPC channels
- no `eval`
- no remote module

## 4. Modules
### renderer/
UI only:
- dashboard
- daily entry
- summaries
- analytics
- planner
- reports
- import
- backup/restore
- settings

### main/
- database bootstrap/migrations
- repositories
- application services
- import/export
- PDF generation
- backup engine
- authentication
- IPC handlers

### domain/
Pure functions:
- revenue math
- period aggregation
- goal math
- capacity math
- pattern detection
- forecasting

Domain functions must not depend on Electron.

## 5. Data flow
1. User submits form.
2. Renderer validates basic shape.
3. Preload invokes typed IPC.
4. Main process validates with Zod again.
5. Service applies business rules.
6. SQLite transaction persists data.
7. Service returns view model.
8. Renderer refreshes relevant queries.

## 6. Query strategy
For v1, the data set is small. Prefer simple SQL aggregation over unnecessary caching.

Create indexes on:
- daily_stats.date
- payment_entries.date if split table is used
- backup metadata timestamp

## 7. State management
Prefer:
- React Query/TanStack Query for async main-process calls
- local component state for forms
- minimal global state

Do not introduce Redux unless complexity proves it necessary.

## 8. Money
All persisted currency is integer cents.

Example:
`$175.25` => `17525`

Formatting is done at UI boundaries.

## 9. Dates
Store daily operational dates as ISO `YYYY-MM-DD`.
Store timestamps as UTC ISO strings.

## 10. Updates
v1 may support manual installer updates.
Automatic updater may be added later after signing/distribution strategy is chosen.

## 11. No external AI dependency
Pattern detection and forecasting must work offline without OpenAI or any other external API.
