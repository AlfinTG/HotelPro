# PROJECT.md — Hotel Management Working Brief

## Project purpose

Build the documented Hotel Management/HotelPro course application as a working full-stack web system, then submit a GitHub repository URL and an accessible demo video URL through Skill Wallet.

## Primary scope

- Visitor: Home, Login, Sign Up, room highlights/carousel, About section and room preview.
- Customer/ordinary user: registration/login, personalized dashboard, room browsing, arrival/departure date selection, booking, My Bookings, cancellation and logout.
- Admin: authorized login, All Bookings, All Rooms, Add Room and All Users.
- Stack: React + Vite, Node.js + Express, MongoDB + Mongoose, Axios, JWT, password hashing, MVC-style backend.

## Working sequence

1. Read `README.md`, `SOLUTION_OVERVIEW.md`, `PRD.md`, `DECISIONS_AND_CONFLICTS.md`.
2. Inspect current repository and Git status.
3. Confirm the decision-register items that affect visible requirements or data semantics.
4. Establish client/server start-up and database connection.
5. Implement authentication and role protection.
6. Implement rooms and date-aware booking/history/cancellation.
7. Build the public/customer/admin UI against real API data.
8. Test all flows and document actual setup commands.
9. Push the code, record the demo, verify the video link, and submit both URLs.

## Non-negotiable rules

- Preserve hotel-specific requirements and the supplied screenshots.
- Do not add unrelated course/student/instructor/doctor/product features from copied generic notes.
- Never save plaintext passwords or raw card/CVV data.
- Do not allow public signup to grant admin permissions just from a client-supplied role.
- Enforce booking ownership and admin access server-side.
- Keep the source conflicts visible in `DECISIONS_AND_CONFLICTS.md`.
- Claim a feature as verified only after the relevant check actually passes.

## Open points

Use `DECISIONS_AND_CONFLICTS.md` for the HotelPro/Roomly name, port/database defaults, role-selector behavior, room inventory semantics and payment approach. Do not silently resolve a material conflict.
