# Antigravity Prompt — Configure, Run and Verify the Project

Use this prompt after the main implementation exists, or when the app is generated but does not start correctly.

---

You are validating the Hotel Management / HotelPro application. Read `README.md`, `PROJECT.md`, `SETUP_AND_DEVELOPMENT_GUIDE.md`, `USER_FLOWS.md`, `DECISIONS_AND_CONFLICTS.md`, `API_SPEC.md`, `SECURITY.md`, and `TESTING.md` first.

## Inspect before changing anything

- Check `git status --short --branch` and preserve all existing changes.
- Inspect `client/package.json`, `server/package.json`, lockfiles, `.env.example`, server entry point, frontend API base URL, MongoDB config, and documented scripts.
- Do not assume ports, scripts, filenames, dependencies or database names: reconcile them with the code and decision register.
- Do not replace entire files to correct a small setup issue.

## Tasks

1. Identify every prerequisite and required environment variable.
2. Verify `.env` is ignored by Git and `.env.example` contains placeholders only.
3. Install dependencies using the repository's actual lockfiles and supported commands.
4. Confirm MongoDB connection configuration and startup behavior.
5. Start the backend and frontend using the actual package scripts.
6. Run the frontend build and available backend/frontend tests.
7. Exercise the key flows in `TESTING.md`: signup, login, customer room browsing, date selection, booking, history, cancellation, admin tabs, room creation, user listing and logout.
8. Check authorization for admin endpoints and booking ownership.
9. Check the date-overlap behavior and server-side total amount.
10. Correct genuine setup/runtime defects with the smallest focused patch; rerun the relevant failing check.
11. Update README and setup instructions only to reflect behavior confirmed in the current repository.

## Rules

- Never expose API keys, JWT secrets, passwords or raw card data in output/screenshots/logs.
- Do not store raw card/CVV data.
- Do not invent test results, environment values, deployment URLs or demo credentials.
- Do not claim the app works if it could not connect to MongoDB or if core API calls are mocked/hardcoded.
- If external setup such as MongoDB is unavailable, state that as a blocker and report what was successfully verified separately.

## Final report

Return a table of each check, command/steps actually run, result and notes. Then list the exact startup commands, environment variables required (names only, redact values), unresolved errors, tests not run and readiness for recording the demo.
