# Security and Privacy Requirements

## Privacy objective
The application is intentionally not an EHR and is not designed to store PHI.

The UI must repeatedly discourage entering patient information into free text.

## Prohibited data fields
Do not create fields for:
- patient name or initials
- DOB
- address
- phone
- email
- diagnosis
- medication
- MRN
- insurance member ID
- claim identifiers associated with an individual
- clinical notes

## Local authentication
- password hash stored locally using a modern password hashing library
- never store plaintext password
- inactivity lock
- rate limit repeated local unlock attempts
- clear lock screen

## Electron
- context isolation enabled
- Node integration disabled in renderer
- CSP
- narrow preload bridge
- validate IPC payloads
- no arbitrary shell execution from renderer
- no arbitrary file path reads from renderer
- file dialogs initiated via main process

## Database
The simplest v1 may use standard SQLite plus OS protections.
Preferred production enhancement:
- encrypted database or encrypted application data using a well-supported approach
- document the actual threat model and limitations
- do not claim HIPAA compliance merely because encryption is present

## Backups
- checksums
- explicit destination
- warnings for shared folders
- restore validation
- no automatic deletion of the final valid backup

## Logs
Do not log:
- passwords
- raw authentication secrets
- full financial exports
- user free-text notes unnecessarily

## Dependency security
- lockfile committed
- dependency audit
- keep Electron current
- avoid abandoned libraries
