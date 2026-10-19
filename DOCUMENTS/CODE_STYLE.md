# Code Style and Repository Conventions

## 1. General principles

- Optimize for clear, maintainable course-project code, not unnecessary abstraction.
- Follow the existing conventions once code exists; this document is the starting point, not permission for a sweeping rewrite.
- Use descriptive names and small modules with one primary responsibility.
- Avoid duplicating validation, API URLs, status strings and date/price logic.
- Do not add dependencies without a reason. The source lists several UI packages; do not automatically install every listed option.

## 2. JavaScript and React

- Use JavaScript/JSX, consistent with the Vite React JavaScript setup instructions, unless the owner explicitly approves a different variant.
- Use functional React components and hooks.
- Keep presentation components separate from API/service logic where practical.
- Use a shared API module (Axios) rather than repeating base URLs in components.
- Keep form state and validation understandable; avoid oversized components that mix page rendering, API transport and business rules.
- Use stable list keys and semantic elements.
- Keep UI role checks as convenience only; backend authorization is mandatory.

## 3. Express and backend

- Keep route declarations, controllers/business logic, Mongoose models, auth middleware and configuration separated in line with the documented MVC pattern.
- Validate request payloads before persistence.
- Centralize error handling where feasible.
- Do not trust client-provided role, amount, owner ID, booking status or availability.
- Keep environment access in config/startup modules, not scattered throughout code.
- Avoid importing the database connection as a side effect in unrelated modules if a simple explicit connection lifecycle is practical.

## 4. Naming and schema conventions

The source documents conflict on `type`, `userType`, `role`, `fromdate`/`fromDate`, `todate`/`toDate`, `totaldays`/`totalDays`, `rent`/`price`, and entry-point naming. Do not use inconsistent field names across layers. Choose a canonical internal name after applying the decision register, then map any externally required legacy naming explicitly.

Proposed canonical style if no rubric constraint exists: camelCase for JavaScript fields and variables (`fromDate`, `toDate`, `totalDays`, `totalAmount`, `userId`, `roomId`). This is a recommendation, not a claim about the source's exact case.

## 5. Error handling

- Return controlled, user-readable errors for normal validation/auth/availability failures.
- Log server-side debugging details without passwords, tokens or card data.
- Avoid silent catch blocks and empty catch handlers.
- Do not claim that a caught error was handled successfully if the operation failed.

## 6. Comments and documentation

- Comment why a non-obvious decision is needed, not every line.
- Update README/setup/API documentation when behavior or configuration changes.
- Mark proposed defaults and known limitations explicitly.
- Keep code-generated documentation factual and aligned with actual files.

## 7. Git hygiene

- Keep changes task-focused.
- Never commit `.env`, real credentials, local database files, logs, or generated build output.
- Review `git diff` before each commit.
- Prefer focused commits with meaningful messages.
- Do not rewrite or delete documentation assets unless requested.
