# Build and Distribution

## v1 deployment model
This is not a hosted web app.
The finished application is packaged as a Windows installer.

## Build targets
- Windows 11 primary
- Windows 10 best effort if Electron version supports it

## Expected commands
Codex should implement scripts equivalent to:
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dist:win`

## Installer
Use electron-builder.
Prefer:
- NSIS installer
- per-user installation for simplest setup
- application data stored in Electron userData path

## Code signing
Unsigned local builds may trigger Windows SmartScreen warnings.
For public distribution, add a Windows code-signing certificate later.

## Updates
Manual installer update is acceptable for v1.
Automatic update is a later feature.

## Codex cloud workflow
1. Put this repository in GitHub.
2. Connect the repository to Codex.
3. Ensure `AGENTS.md` is at repository root.
4. Configure the Codex environment to install dependencies.
5. Give Codex the task in `CODEX_BUILD_TASK.md`.
6. Require it to run tests and build.
7. Review the diff and test evidence.
8. Merge the completed branch/PR.
9. Run Windows packaging on a Windows-compatible CI runner or Windows machine if Codex's environment cannot create/test the Windows installer.

Codex should not be instructed to upload the user's practice data. Development uses synthetic seed data only.
