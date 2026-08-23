# Codex Instructions

You are implementing a production-quality Windows desktop application for a solo psychiatric practice.

## Read first
Before coding, read:
1. `README.md`
2. `docs/REQUIREMENTS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE.md`
5. `docs/UI_SPEC.md`
6. `docs/ANALYTICS.md`
7. `docs/SECURITY.md`
8. `docs/TESTING.md`

## Non-negotiable product rules
- This is a **local-first Windows desktop application**.
- Do not introduce a cloud database in v1.
- Do not store patient-identifying data or clinical PHI.
- Do not add fields for patient name, DOB, diagnosis, medications, address, phone, email, MRN, insurance member ID, or clinical notes.
- Treat financial data as sensitive business data.
- All key financial assumptions must be configurable in Settings.
- All derived metrics must be reproducible from stored data.
- Forecasts must be visibly labeled as forecasts.
- Never silently overwrite user data.
- Backups and imports must be safe and reversible where practical.
- Use integer cents for currency in persisted data. Never use floating point for stored money.

## Engineering rules
- TypeScript strict mode.
- React functional components.
- Validate all IPC inputs with Zod.
- Renderer must not have unrestricted Node access.
- Use Electron context isolation.
- Keep `nodeIntegration: false`.
- Use a narrow preload API.
- Use SQLite transactions for multi-step writes.
- Add database migrations.
- Keep domain calculations in pure TypeScript modules with unit tests.
- Do not put financial formulas directly inside UI components.
- Prefer explicit names over clever abstractions.

## Testing
Before completing a task, run the relevant commands:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e` when UI workflows change

If a command fails, fix it unless blocked by the execution environment. Report any unresolved environment limitation clearly.

## UX
The user is not a software developer.
- Prefer plain-English labels.
- Minimize required data entry.
- Make the Dashboard understandable in under 30 seconds.
- Avoid jargon such as CAGR unless explained.
- Destructive actions require confirmation.
- Settings should contain sensible defaults and inline explanations.

## Definition of done
A feature is not done until:
- acceptance criteria are met,
- validation exists,
- calculations are tested,
- migrations are included if storage changes,
- empty states and error states are handled,
- keyboard usability is reasonable,
- no PHI fields have been introduced.
