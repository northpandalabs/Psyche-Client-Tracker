# Practice Analytics Desktop

A Windows desktop application for a solo psychiatric practice to track aggregate patient volume, visit mix, cancellations/no-shows, revenue, insurance/patient payments, goals, capacity, and trends.

## Privacy model
This application is intentionally designed **not to store patient-identifying information or clinical PHI**. It stores aggregate operational statistics only.

Do not add patient names, DOBs, diagnoses, MRNs, medications, addresses, emails, phone numbers, insurance member IDs, claim IDs tied to people, or free-text clinical notes.

## Product goals
The app should answer:

- How many patients did I see today, this week, this month, quarter, and year?
- How many were new patients versus follow-ups?
- What visit types are increasing or decreasing?
- What days are busiest and slowest?
- What are my cancellation and no-show rates?
- How much did I bill?
- How much did insurance pay?
- How much did patients pay?
- How much was adjusted/written off?
- How much remains outstanding?
- Am I on pace for my weekly/monthly/annual revenue goals?
- How many additional visits do I need to hit a revenue goal?
- What patterns in my practice might I be missing?

## Intended platform
- Windows desktop
- Single user
- Local-first data storage
- Password-protected
- Export to Excel/CSV and PDF
- Local backups
- No cloud database required for v1

## Recommended stack
- Electron
- React
- TypeScript
- Vite
- Node.js
- SQLite
- Drizzle ORM (preferred)
- Zod validation
- Recharts
- Vitest
- Playwright

See `AGENTS.md` before making changes.

## Development

Requirements: Windows 10/11, Node.js 22 LTS, and npm.

```powershell
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Run the renderer during UI development with `npm run dev`. The packaged app uses
Electron, a context-isolated preload bridge, and a SQLite database stored in the
current Windows user's Electron application-data folder. Currency is persisted as
integer cents. No patient-identifying fields are present.

## Create the Windows installer

From a Windows PowerShell prompt in this directory, run:

```powershell
npm install
npm run dist:win
```

The NSIS installer is written to `dist-electron`/the electron-builder output
directory. Code signing is not configured; Windows SmartScreen may therefore warn
on an installer distributed outside your own computer.

## Current data safety notes

- The password hash and business database are local only.
- Use **Backup / Restore** to create dated SQLite copies in a private folder.
- CSV export intentionally excludes business notes.
- Standard SQLite relies on Windows account and disk protections; database-level
  encryption and restore/import previews remain production-hardening work.
