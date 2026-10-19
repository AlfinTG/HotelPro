# Security Requirements — Hotel Management

## 1. Purpose

This is a course project, but it should demonstrate basic secure full-stack practices. Security rules in this document supplement the functional requirements; they do not authorize dropping the documented features without recording a decision.

## 2. Authentication

- Hash passwords with the documented `bcryptjs` dependency or a compatible password-hashing library.
- Never store plaintext passwords or confirm-password values.
- Never return password hashes to the frontend.
- Keep the JWT signing secret in server environment configuration only.
- Validate token signature and expiry on protected routes.
- Handle missing, malformed and expired tokens cleanly.
- Clear client session state on logout.
- Use an appropriate token/session approach consistently; the source mentions `localStorage`, so do not change it silently. If JWT is stored in localStorage, understand and mitigate the risk from cross-site scripting.

## 3. Role-based authorization

The product defines customer/ordinary user and admin roles. Authorization must be checked on every protected API operation, not only by hiding UI tabs.

**Important source conflict:** the source User Flow says the public registration form requires a User Type selection with Admin/Ordinary values. A public request must not be allowed to grant admin privileges just by submitting `type: "admin"`. Use trusted admin seeding/invitation or an explicit approved mechanism. Record whether the UI still displays a role selector in `DECISIONS_AND_CONFLICTS.md`; do not silently pretend the source did not ask for it.

- Customer endpoints operate on the authenticated user's own bookings.
- Admin-only endpoints protect room creation and system-wide views of bookings/users.
- Do not expose other users' sensitive fields.

## 4. Payment data

The source ERD contains card number, CVV, expiry and cardholder name. Do not store raw card number/CVV in MongoDB or logs. The course notes do not define a provider or secure payment integration. Use a clearly labelled simulated payment/confirmation flow unless a payment provider and its supported checkout model are explicitly selected. If real payments are required, use provider-hosted/tokenized checkout and store only safe references/status.

## 5. Input and data validation

- Validate all client input on the server.
- Normalize and validate email before uniqueness checks.
- Reject malformed room IDs and booking IDs.
- Reject past/invalid/reversed date intervals according to the approved product rule.
- Calculate booking duration and total price server-side.
- Do not trust client-submitted status, user ID, role, room availability, total amount or booking owner.
- Restrict uploaded file types, size and names if Multer uploads are implemented; otherwise avoid adding file upload complexity when URLs are sufficient.

## 6. Secrets and configuration

- Commit `.env.example` with placeholder values only.
- Add `.env`, private keys, real credentials, tokens and local database dumps to `.gitignore`.
- Do not insert real admin passwords in docs or source code.
- Do not log passwords, tokens, raw payment details or full sensitive request bodies.
- Keep the Mongo URI and JWT secret server-side.
- Frontend environment variables must not contain server-only secrets.

## 7. Database and booking integrity

- Enforce unique email at the database level as well as in application logic.
- Check booking availability on the backend immediately before persistence.
- Validate booking ownership on read/cancel operations.
- Handle concurrent booking attempts as safely as the chosen data model allows. If `count` represents multiple units, document how inventory is decremented/locked or reconciled.
- Use explicit allowed booking statuses.

## 8. HTTP and error hygiene

- Configure CORS for the real frontend origin in deployment; do not assume permissive CORS is secure for production.
- Return useful but non-sensitive errors.
- Do not expose stack traces, environment variables or secrets to clients.
- Use a centralized error handler where practical.

## 9. Definition of security done

- A password is stored only as a hash.
- Unauthenticated access to protected APIs fails.
- A customer cannot access admin-only APIs or another user's bookings.
- Public signup cannot silently produce an admin account.
- No committed `.env` or real secrets are present.
- No raw card/CVV data is stored.
- Booking amounts and availability decisions are made by the backend.
