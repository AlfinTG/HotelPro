# Shared Project Workflow Instructions

> Use this only if more than one contributor or agent is working on Hotel Management. The current source materials assign the project to one named individual; do not invent teammates or assign work to unknown people.

## Working rules

1. Read `CHATGPT_PROJECT_INSTRUCTIONS.md`, `SOLUTION_OVERVIEW.md`, `PRD.md`, `DECISIONS_AND_CONFLICTS.md`, and relevant technical documents before making changes.
2. Inspect the real repository, current Git branch/status, package manifests, environment examples, routes, models and tests before proposing or applying edits.
3. Use one owner, one bounded task and one branch per contributor/agent. Avoid two agents editing the same file simultaneously.
4. Do not commit directly to `main` if the owner has requested branch/PR review. Never merge, force-push or deploy without the owner's authorization.
5. Preserve unrelated files and uncommitted work. Do not replace entire files to make small changes.
6. Keep changes aligned with the hotel-specific scope. Ignore generic examples about students, courses, instructors, doctors or products unless the project owner explicitly expands the scope.
7. When source documents conflict, consult `DECISIONS_AND_CONFLICTS.md`. Do not silently overwrite source requirements. Record a decision or ask the owner for a material choice.
8. Keep credentials, tokens, password values and raw card data out of prompts, code, commits, logs and screenshots.
9. Run the narrowest relevant tests after each meaningful change, then run the full smoke flow before final submission.
10. Do not claim features, commands, tests, repository writes or deployments succeeded unless the actual evidence confirms it.

## Antigravity task prompt requirements

Each implementation prompt should include:

- **Context:** exact document names used as source of truth.
- **Objective:** one bounded feature or vertical slice.
- **First inspect:** repository status, branch, files and current conventions.
- **Scope:** allowed files/modules and areas that must remain untouched.
- **Behavior:** expected requirements grounded in source documents.
- **Conflicts:** applicable decisions from `DECISIONS_AND_CONFLICTS.md`.
- **Security:** required authorization, validation and secret-handling constraints.
- **Acceptance:** concrete user-visible/API outcomes and tests.
- **Definition of done:** focused diff and honest handoff.
- **Report format:** files changed, behavior, tests run/results, tests not run, limitations, suggested commit message.

## End-of-task handoff

- Owner/branch.
- Objective completed.
- Files changed and rationale.
- Tests/commands actually run and results.
- Tests not run and why.
- Known limitations and conflicts.
- Suggested commit message/PR description.

If a task requires a broad refactor, a change to a shared data contract, or an unresolved product decision, stop before making that unrelated change and explain the smallest decision the owner must make.
