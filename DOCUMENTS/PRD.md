# Product Requirements Document (PRD)

## 1. Document status

- Product: HotelPro / Hotel Management (name mismatch is tracked separately).
- Status: Requirements derived from the user-provided Skill Wallet documents and screenshots.
- Audience: project owner, ChatGPT Project, Antigravity coding agent, and course evaluator.
- Priority: **P0** = essential for the documented core flow; **P1** = documented enhancement or polish; **P2** = optional future enhancement not established as a submission blocker.

## 2. Product statement

Provide a working full-stack hotel booking application in which customers can discover rooms and manage reservations, while authorized administrators can manage room inventory and monitor bookings/users.

## 3. Users and jobs to be done

**Visitor:** “I want to understand the hotel offering and find the registration/login path.”  
**Customer:** “I want to sign in, see room options, choose dates, book, and manage my booking history.”  
**Administrator:** “I want to see bookings, manage room listings, add rooms, and inspect registered users.”  
**Course evaluator:** “I want to run or inspect the project and view a short demo proving the required flows work.”

## 4. Functional requirements

### P0 — Public landing page

- Provide a home page accessible to visitors.
- Include navigation to Home, Login and Sign Up as described in the user-flow document.
- Include a room-highlight carousel, About section and rooms preview as documented.
- Keep navigation and layout responsive/mobile-friendly.

**Acceptance:** a fresh visitor can load the home page and reach the login and registration screens; layout remains usable at desktop and mobile widths.

### P0 — Registration and authentication

- Registration fields in the user-flow document: name, email, password, confirm password, phone, and user type.
- Validate required fields and password/confirmation match.
- Reject duplicate emails.
- Hash passwords using a password-hashing library (bcryptjs is named in backend setup notes).
- Login uses email and password.
- Issue and validate JWT for protected API operations, following the documented flow.
- Customer and admin access must be distinct.
- Logout clears the client-side session state and returns the visitor to the home page.

**Acceptance:** valid signup/login works; invalid credentials and duplicate email are handled visibly; protected endpoints reject missing/invalid tokens. Administrator privilege assignment must follow the decision documented in `DECISIONS_AND_CONFLICTS.md`, not trust an unverified client-supplied role.

### P0 — Customer dashboard

- Show a personalized greeting (example in source: `Hi, {user name}`).
- Provide navigation to Rooms and My Bookings, plus Logout.
- Display room listings with photo/image, type, price/rent, and features/details.

**Acceptance:** authenticated customer sees the dashboard and available room data returned by the API; unauthenticated users cannot open customer-only pages.

### P0 — Room browsing and booking

- Support selection of arrival/from date and departure/to date.
- Make room choices available based on dates as intended by the role/responsibility and user-flow documents.
- Display room type, relevant dates and amount/price before submission.
- Create a booking through the backend and persist it in MongoDB.
- Prevent invalid date ranges. Do not allow overlapping active bookings for an inventory unit/room where the room model indicates a single room number; if `count` represents multiple units, inventory semantics must be explicit.
- The source material mentions payment. Until a real provider is confirmed, use a clearly labelled simulated payment/confirmation and do not store card numbers or CVVs.

**Acceptance:** a valid booking persists and appears in My Bookings; invalid dates or unavailable room dates return a useful error; booking totals are calculated server-side.

### P0 — My Bookings and cancellation

- Display booking ID, room type, from/to dates, total amount, customer phone and status (Active/Cancelled are named in the features doc).
- Allow a customer to cancel their own eligible booking.
- The documented flow names `POST /cancelbooking` and says the button is enabled when the status is not `cancelled`.
- A user must not cancel a booking that belongs to another user.

**Acceptance:** cancellation changes persisted status; the list updates; cancelled bookings cannot be repeatedly cancelled as if still active; authorization is enforced server-side.

### P0 — Administrator dashboard

- Provide a tab-based admin interface. The feature document specifically names `MDBTabs`.
- Tabs: All Bookings, All Rooms, Add Room, All Users.
- All Bookings: inspect all customer bookings and active/cancelled status.
- All Rooms: inspect the rooms currently available in the system.
- Add Room: create room records with relevant details, including type, price/rent, photos/images and attributes present in the model notes.
- All Users: inspect registered users.
- Display administrator greeting and Logout.

**Acceptance:** a provisioned admin can use all four tabs; a customer cannot call admin APIs successfully even by manually crafting a request.

### P2 — Optional user-role management

The Features document says role management for Admin/Ordinary users is optional. Only implement it if the core flows are complete and the owner/evaluator confirms it is needed. Any role change must be performed through an admin-authorized backend operation and must not expose or allow unauthorized privilege escalation.

### P1 — Visual polish and responsive behavior

- Use the supplied output screenshots as visual reference for user registration/login, customer dashboard, admin status cards, room table, Add Room form and users table.
- Provide readable form labels, useful validation/errors and loading/empty states.
- Keep the design cohesive rather than combining every optional UI library named in the notes.

### P1 — Project setup and documentation

- Add a clear README with required tools, environment variables, installation commands, run commands, demo credentials/seed instructions where appropriate, and troubleshooting.
- Keep the setup repeatable from a clean checkout.

## 5. Non-functional requirements

- **Security:** hash passwords, protect routes, validate inputs, keep secrets out of source control, and enforce authorization on the server.
- **Correctness:** date-aware availability; server-side booking total and validation; reliable persisted booking status.
- **Maintainability:** straightforward React/Express/Mongoose structure with separated route/controller/model concerns consistent with the MVC document.
- **Usability:** responsive and understandable forms/tables/dashboards with useful error feedback.
- **Reproducibility:** documented local setup and verifiable demo flow.
- **Honesty:** distinguish implemented features from future items and test results from assumptions.

## 6. Out of scope unless owner confirms

- Real payment gateway integration.
- Storing or processing real payment card data directly.
- Multiple hotels/chains, staff scheduling, analytics, email/SMS, loyalty systems, or advanced revenue tools.
- Products, courses, instructors, doctors, students or other generic examples found in copied instructional text.
- Features such as editing/deleting rooms beyond the documented optional note; add only if the core flow is complete or the owner requests them.

## 7. Acceptance checklist

A submission candidate must demonstrate:

1. Landing page navigation.
2. Registration and login with validation.
3. Protected customer dashboard and room listing.
4. Room selection by date and booking persistence.
5. Booking history with correct status and details.
6. Booking cancellation and ownership enforcement.
7. Admin dashboard with all four documented tabs.
8. Admin-only room creation and users/bookings views.
9. Database connection and clean setup from README.
10. No secrets in committed files; no raw card/CVV persistence.
11. Successful frontend build and a recorded smoke-test result.
12. Public/accessible GitHub repo and demo video link submitted to Skill Wallet.
