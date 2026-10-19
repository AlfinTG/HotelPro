# Antigravity Prompt — Build the Hotel Management Application

Copy the prompt below into the Antigravity agent after adding this documentation pack to the ChatGPT Project and repository. It is intended for full implementation, not merely a plan.

---

You are the senior full-stack engineer implementing the **Hotel Management / HotelPro** course project. The goal is a working application that satisfies the supplied course documents and screenshots, can be pushed to GitHub, and can be demonstrated in a short video for Skill Wallet.

## Read the source of truth first

Read these files before editing: `README.md`, `PROJECT.md`, `PROMPTS.md`, `SOLUTION_OVERVIEW.md`, `PRD.md`, `USER_FLOWS.md`, `DECISIONS_AND_CONFLICTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`, `TESTING.md`, `REQUIREMENTS_TRACEABILITY.md`, and `SETUP_AND_DEVELOPMENT_GUIDE.md`. Inspect reference images under `reference-assets/`. Do not skip the decision register or the original UI references.

## First action: inspect, summarize, then proceed

1. Inspect the actual repository tree, current Git branch/status, recent commits, and any existing source code.
2. Confirm whether this repository currently contains documentation only or any application code; do not assume.
3. Identify existing `package.json` files, lockfiles, scripts, environment examples, database configuration, current routes/models/components, and tests.
4. Summarize required feature areas, current implementation state, and decision-register items that affect code.
5. Preserve all existing project-owner changes and reference assets. Do not wipe the repository or rewrite working files merely to start over.
6. If a material open decision changes visible requirements or data semantics (brand, role selector, room inventory model, payment), report the exact source conflict and the recommended choice in the initial summary. Do not present a proposed default as owner-approved. You may continue independent scaffold/setup work, but do not finalize the affected visible behavior/schema until the owner confirms the choice or explicitly tells you to use the proposed default.

## Product outcome

Build a responsive MERN application with:

- React + Vite frontend.
- Node.js + Express backend.
- MongoDB with Mongoose models.
- Axios client-server communication.
- Password hashing and JWT-protected routes.
- MVC-style separation: models, controllers, routes, middleware/config.
- Public landing page, room highlights/carousel, About section and room preview.
- Registration and login with the documented input validation.
- Customer dashboard with personalized greeting, room browsing, date-aware booking, My Bookings and cancellation.
- Admin dashboard with four tabs: All Bookings, All Rooms, Add Room and All Users.
- Room and booking details matching `PRD.md` and `DATABASE.md`.
- Readable loading, empty, success and error states.
- Setup documentation and a reproducible demo workflow.

## Preserve the documented feature names and routes where specified

The course user-flow document explicitly names `POST /SignUp`, `POST /Login`, `GetRooms`, and `POST /cancelbooking`. Preserve these paths/aliases where practical and document their methods precisely. Other admin/booking paths are proposed in `API_SPEC.md`; ensure the final contract is consistent and update the docs to match implemented code. Do not build a reports feature just because a generic backend screenshot shows `/reports`.

## Security and correctness

- Hash passwords; never store plaintext or confirmation passwords.
- Validate all input on the server.
- Protect customer and admin APIs with JWT middleware and role checks.
- A customer can only read/cancel their own bookings.
- A public registration body must not be trusted to grant admin privileges. Follow the owner's recorded role decision; provide a trusted admin seed/provisioning path.
- Do not store raw card number, CVV or expiration data. Use a clearly labelled simulated payment step unless a real payment provider is explicitly approved.
- Calculate booking duration and amount server-side.
- Validate arrival/departure dates, room existence and active-booking overlap.
- Resolve `Room.count` inventory semantics using `DECISIONS_AND_CONFLICTS.md`; do not silently choose incompatible behavior.
- Use `.env.example` placeholders only. Never commit `.env`, secrets, tokens or credentials.

## Visual implementation

Use the actual reference images, not generic guesses. Keep the public/customer/admin page inventory and labels aligned with `DESIGN_SYSTEM.md`. The source specifically mentions an admin tab interface using MDBTabs and a gradient/blue-purple navigation treatment. Do not install every UI framework listed in the rough notes; choose a coherent minimal combination and preserve the visible result. Do not fabricate screenshots or say a screen matches if you have not compared it.

## Implementation strategy

Proceed in vertical slices; do not generate a huge unverified code dump.

1. Scaffold/configure client, server and MongoDB connection.
2. Implement User model, registration/login, password hashing, JWT middleware and admin provisioning.
3. Implement Room model, room list and admin room creation.
4. Implement Booking model, date-aware availability, create booking, My Bookings and cancellation.
5. Build/finish the public, customer and admin UI connected to real API calls.
6. Add seed/demo data and clear README/setup docs.
7. Run the tests/build and use the browser where available to verify the full flow.

After each stage, report files changed and the tests or commands actually run. Fix failures before proceeding where feasible.

## Acceptance criteria

The app is ready only when the checks in `TESTING.md` and `REQUIREMENTS_TRACEABILITY.md` are addressed: customer signup/login, room browsing, valid booking, booking history, cancellation, admin room creation, All Bookings/All Rooms/All Users tabs, role/ownership denial tests, database persistence, frontend build, and repeatable setup. If anything cannot be finished, mark it explicitly as deferred and state why. Do not claim verified when only implemented.

## Git and reporting

Inspect Git status before any modifications. Use the agreed feature branch/workflow; do not force-push, merge, deploy, or discard files without authorization. Review `git diff` before commit. Final report must include:

- Current branch and Git status.
- Files added/changed.
- Features implemented.
- Commands/tests actually run and results.
- Tests not run and why.
- Known gaps/risks.
- Exact local startup steps.
- Suggested commit message.
- Whether the repository is pushed and whether the demo has been recorded, stating these only if confirmed.

Do not stop after producing a plan. After the concise initial summary, build the application in the stages above, verify each stage, and report blockers honestly.
