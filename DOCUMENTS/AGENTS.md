# AGENTS.md — Instructions for ChatGPT and AI Coding Agents

Read `README.md`, `PROJECT.md`, `SOLUTION_OVERVIEW.md`, `PRD.md`, `USER_FLOWS.md`, and `DECISIONS_AND_CONFLICTS.md` first. Then read `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`, and `TESTING.md` relevant to the task.

## Project in one line

A MERN-stack Hotel Management/HotelPro course application with visitor pages, customer registration/login, room browsing, date-aware bookings and cancellation, plus an admin dashboard for all bookings, all rooms, adding rooms and all users.

## Before every task

1. Inspect Git status/branch and uncommitted work.
2. Inspect the actual repository structure and source files before editing.
3. Read the current task's requirements and the applicable decisions register entries.
4. Confirm existing package scripts and runtime commands; do not invent them.
5. Identify the smallest change that completes the requested task.

## Product rules

- Treat hotel-specific course documents and screenshots as the scope source.
- Do not add unrelated students, instructors, courses, doctors, products/orders or generic tutorial routes.
- Preserve the public home, auth, customer dashboard, booking lifecycle and four admin tabs.
- Keep the React/Vite + Express/Node + MongoDB/Mongoose direction unless the owner changes it.
- Follow the documented MVC separation and use Axios for client/server communication.
- Route/API details, role naming, ports, database name and display brand have conflicts; consult `DECISIONS_AND_CONFLICTS.md`.
- A code example in a source document is illustrative; verify completeness before copying it.

## Security rules

- Hash passwords; never persist confirmation passwords.
- Do not expose hashes, JWT secrets or environment values.
- Enforce role/ownership checks in backend routes/controllers.
- Do not let a public role field alone grant admin privileges.
- Never save raw card numbers/CVVs. Simulated payment is the proposed default until a payment provider is specified.
- Never trust client-provided booking amount, user ID, status or availability.
- Validate date ranges and room availability server-side.

## Coding rules

- Keep code focused and readable.
- Follow existing file conventions where a codebase already exists.
- Avoid unnecessary dependencies and sweeping rewrites.
- Preserve unrelated work and reference assets.
- Add/update tests for changed behavior.
- Update README/setup/API docs when runtime behavior changes.

## Git rules

- Work on the explicitly assigned branch when one is requested; otherwise report the current branch.
- Do not force-push, merge, or deploy without authorization.
- Review the diff before committing.
- Never claim a commit, push, test, deployment or feature succeeded without real evidence.

## Conflict handling

If a source inconsistency materially affects UI, data semantics, role behavior, payment, or evaluator expectations, consult the decision register. Use a documented proposed default only if the project owner has accepted that mode of work. Do not silently erase source evidence or present a proposed choice as an original requirement.

## Completion report

Report: objective, files changed, important behavior, commands/tests actually run, their results, tests not run, known risks/limitations, and next step. Label code as implemented versus verified accurately.
