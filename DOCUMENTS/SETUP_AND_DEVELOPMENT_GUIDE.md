# Setup and Development Guide

## 1. Before coding

1. Read `SOLUTION_OVERVIEW.md`, `PRD.md` and `DECISIONS_AND_CONFLICTS.md`.
2. Review `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md` and `SECURITY.md`.
3. Inspect the reference screenshots in `reference-assets/output-screenshots/` and code-example images in `reference-assets/backend-examples/`.
4. Confirm the four must-confirm decisions in the decision register where possible.
5. Inspect the actual repository tree and Git status before scaffolding. This documentation pack is not application source code.

## 2. Required tools referenced by the source

- Operating system: Windows 10/11, macOS or Linux (as listed in the source overview).
- Node.js v16 or above (source requirement; use a currently supported Node version compatible with dependencies).
- npm v8 or above.
- React with Vite.
- Express/Node.js backend.
- MongoDB and Mongoose.
- Git and GitHub.
- Visual Studio Code or another editor capable of running the project.
- Chrome or Firefox for browser testing.
- Postman is mentioned for API testing.

The source hardware guidance asks for an Intel Core i5 (8th generation or above) / AMD Ryzen 5 or better, at least 8 GB RAM (16 GB recommended), at least 1 GB free storage, and a 1366x768 or higher display. These are source-reported recommendations, not hard application constraints.

## 3. Proposed workspace layout

Use the lowercase `client/` and `server/` layout described in `ARCHITECTURE.md` unless the project owner approves otherwise. The source documents disagree on capitalization and backend entry-point filename; the proposed default is `server/index.js`.

## 4. Environment configuration

Create `server/.env` locally and keep it out of Git. A proposed shape:

```dotenv
PORT=8001
MONGO_URI=mongodb://127.0.0.1:27017/hotel
JWT_SECRET=replace-with-a-long-random-local-secret
CLIENT_ORIGIN=http://localhost:5173
```

The values above use proposed defaults from `DECISIONS_AND_CONFLICTS.md`, not a claim that the original source is consistent. Create `server/.env.example` with safe placeholder strings. Frontend API URL should be configured using the Vite environment convention, e.g. a `VITE_API_BASE_URL` placeholder if the implementation uses one. Only `VITE_` values are exposed to frontend code; never put server secrets there.

## 5. Installation and run commands

The course execution notes say:

- Start frontend from the client folder with `npm run dev`; expected Vite address is `http://localhost:5173`.
- Start backend from a separate terminal in the server folder with `nodemon index.js`; execution notes say `http://localhost:8001`.
- Configure MongoDB using `MONGO_URI=mongodb://localhost:27017/hotel` in the setup note.

Because the repository does not yet contain package manifests, the exact install/start scripts must be confirmed once Antigravity creates `client/package.json` and `server/package.json`. Update this section to match actual scripts before submission. Do not invent a working command if the package manifest does not define it.

## 6. Recommended build stages

### Stage A — foundation

- Scaffold client and server.
- Verify dependency installation, frontend start, backend start, and Mongo connection.
- Create a health endpoint or equivalent minimal evidence of backend availability if appropriate.

### Stage B — data and authentication

- Define User, Room and Booking schemas.
- Implement registration/login and password hashing.
- Implement JWT verification and role middleware.
- Verify role-provisioning approach before enabling admin access.

### Stage C — room and booking operations

- Add room listing and admin room creation.
- Implement date validation and room inventory semantics.
- Create bookings and query the current user's bookings.
- Implement cancellation and status handling.

### Stage D — UI

- Implement public pages, customer dashboard, My Bookings and tabbed admin dashboard.
- Connect UI to real API responses with Axios.
- Follow `DESIGN_SYSTEM.md` and supplied screenshots.

### Stage E — verification and delivery

- Run checks in `TESTING.md`.
- Update README, API contract and environment instructions based on real code.
- Verify Git diff/status.
- Record the demo using the flow in `DEMO_AND_SUBMISSION.md`.
- Submit the repository and video links through Skill Wallet.

## 7. Troubleshooting checklist

- **Frontend can't reach backend:** inspect API base URL, port, server terminal and CORS origin.
- **Mongo connection fails:** confirm MongoDB service/URI, database permissions and environment loading; do not print secrets.
- **Login always fails:** check email normalization, password hashing/compare and request body names.
- **Admin tabs show empty content:** verify the corresponding protected endpoints and persisted seed/test data.
- **Booking always unavailable:** inspect overlap logic and whether `Room.count` represents physical rooms or quantity.
- **Images do not show:** confirm valid URLs or upload path and provide a fallback.
- **Module/command not found:** inspect actual package manifest and install scripts; don't guess versions blindly.

## 8. Final clean-checkout verification

Clone the GitHub repository into a fresh directory, follow only documented commands, create `.env` from `.env.example`, seed demo records using the documented mechanism, start MongoDB/client/server, and perform the customer/admin flows. Record any step that cannot be reproduced. A successful run in the original development folder is not enough to guarantee that another evaluator can run it.
