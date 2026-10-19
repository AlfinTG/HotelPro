# Testing and Verification Plan

## 1. Goal

Verify the actual end-to-end workflows required by the Hotel Management documents. A generated UI, a successful frontend build, or a code agent's statement is not sufficient evidence that a flow works. Record commands run and outcomes honestly.

## 2. Testing layers

### A. Static and build checks

- Install dependencies from the lockfiles when available.
- Run the frontend production build using the script actually defined in `client/package.json`.
- Run any documented lint/typecheck/test scripts that exist. Do not invent script names before inspecting manifests.
- Check that environment examples do not contain real credentials.

### B. Backend/API tests

- Database connection succeeds with configured MongoDB URI.
- Registration validates input, rejects duplicate email, and saves a password hash.
- Login returns success only for valid credentials.
- Protected APIs reject missing/invalid/expired JWTs.
- Admin endpoints reject customer tokens.
- Customer can only access/cancel their own bookings.
- Room creation validates required data.
- Booking validation checks dates, room existence, availability, status and server-calculated amount.
- Cancellation updates persisted status and prevents invalid repeated transitions.

### C. Frontend/manual tests

- Home page navigation reaches Login and Sign Up.
- Registration error/success messages are visible.
- Login selects the correct dashboard for the authorized role.
- Customer sees room list, selects dates, books, and sees history.
- Customer cancels an eligible booking and sees updated status.
- Admin can switch through All Bookings, All Rooms, Add Room and All Users.
- Newly added rooms persist after refresh.
- Logout removes usable session state and protected pages are unavailable.
- Test narrow/mobile layout and standard desktop width.

### D. End-to-end demo regression

Use seeded or fresh demo records:

1. Visit landing page.
2. Register/log in as customer.
3. Browse rooms and choose a future arrival/departure interval.
4. Create a booking and verify booking history.
5. Cancel it and verify status.
6. Log out.
7. Log in using the trusted seeded admin account.
8. Add a room and confirm it appears under All Rooms.
9. Open All Bookings and All Users.
10. Attempt customer access to an admin API and verify rejection.

Never record real secrets in the demo.

## 3. Booking-specific edge cases

- Departure date is equal to or earlier than arrival date.
- Missing dates or nonexistent room.
- Booking overlaps an active booking for the same inventory unit.
- Cancelled booking no longer blocks availability if that is the chosen rule.
- Customer requests another user's booking ID.
- Repeated cancellation request.
- Client attempts to submit a lower total amount or forged status.
- If `count` means multiple units, concurrent bookings do not exceed capacity.

## 4. Test evidence log

Use a short table in the final handoff or README:

| Check | Command/steps actually run | Result | Notes |
|---|---|---|---|
| Frontend build | Fill after run | Not run | Do not claim success in advance |
| Backend startup | Fill after run | Not run | Confirm actual entry point and port |
| Mongo connection | Fill after run | Not run | Use safe logs |
| Customer happy path | Fill after run | Not run | Register/login/book/cancel |
| Admin happy path | Fill after run | Not run | Add room and view tabs |
| Authorization boundary | Fill after run | Not run | Customer blocked from admin APIs |

## 5. Release gate

Do not call the project complete until the required customer and admin journeys work against persisted backend data, critical authorization tests pass, the setup guide works from a clean environment, and a real video of the working application has been recorded and made accessible. Mention all skipped tests and limitations.
