# HotelPro — Hotel Booking and Management System

A MERN-stack hotel booking and management application built as a full-stack course project.

**Stack:** React + Vite · Node.js + Express · MongoDB + Mongoose · Axios · JWT · Bootstrap · MDB React UI Kit

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | v16 or higher |
| npm | v8 or higher |
| MongoDB | v5 or higher (running locally or via connection string) |
| Git | Any recent version |

---

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/AlfinTG/HotelPro.git
cd HotelPro
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Open `server/.env` and set real values:

```dotenv
PORT=8001
MONGO_URI=mongodb://127.0.0.1:27017/hotel
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

> **Never commit `server/.env`.** It is excluded by `.gitignore`.

### 3. Configure the frontend

```bash
cd ../client
cp .env.example .env
```

The default value `VITE_API_BASE_URL=http://localhost:8001` matches the backend default — no change needed for local development.

### 4. Install dependencies

Open **two terminals**.

**Terminal 1 — backend:**

```bash
cd server
npm install
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
```

### 5. Provision the administrator account and demo rooms

Before starting the servers, seed the database with the admin account and demo room catalogue. Run these from the `server/` directory:

```bash
cd server

# Create the administrator account (reads credentials from server/.env)
npm run seed:admin

# Insert 8 demo rooms (Standard × 2, Deluxe × 2, Non-Deluxe × 2, Suite × 2)
# Safe to run repeatedly — rooms that already exist are skipped automatically
npm run seed:rooms

# Or run both in one command
npm run seed
```

> - **Admin credentials** come from the `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_PHONE` variables in `server/.env`. Never commit real credentials.
> - **Demo rooms** use only public Unsplash URLs — no external accounts required.
> - Re-running either command on a populated database is safe: existing records are **never** overwritten or deleted.

Expected output for `seed:rooms` (first run):
```
[Room Seeding] Checking 8 demo room definitions…
[Room Seeding]   OK    Room 101 (Standard, $2500/night) inserted.
…
[Room Seeding]   Inserted : 8
[Room Seeding]   Skipped  : 0 (already existed)
[Room Seeding]   Failed   : 0
[Room Seeding] Done.
```

Expected output (subsequent runs — idempotent):
```
[Room Seeding]   SKIP  Room 101 — already exists in database.
…
[Room Seeding]   Inserted : 0 | Skipped : 8 | Failed : 0
[Room Seeding] Done.
```

---

### 6. Start MongoDB

Ensure MongoDB is running locally before starting the backend:

```bash
# macOS / Linux (if installed via Homebrew)
brew services start mongodb-community

# Windows (if installed as a service)
net start MongoDB

# Or start mongod directly
mongod --dbpath /path/to/data/db
```

### 7. Start the servers

**Terminal 1 — backend (runs on http://localhost:8001):**

```bash
cd server
npm run dev        # uses nodemon for auto-reload
# or
npm start          # production mode
```

Expected output:
```
[DB] MongoDB connected: 127.0.0.1 / hotel
[Server] HotelPro API running on http://localhost:8001
```

**Terminal 2 — frontend (runs on http://localhost:5173):**

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Health check

To verify the backend is running:

```bash
curl http://localhost:8001/health
# Expected: {"status":"ok","project":"HotelPro","timestamp":"..."}
```

---

## Running tests

All tests run from the **repository root** with a single command. The backend suite runs with `--test-concurrency=1` to prevent shared-database race conditions:

```bash
npm test
```

Expected output:

```
ℹ tests 113
ℹ pass  113
ℹ fail  0
```

---

## Production build

```bash
npm --prefix client run build
```

Build output is placed in `client/dist/` (excluded from Git).

---

## Project documentation

All specification documents are in the [`DOCUMENTS/`](./DOCUMENTS/) directory:

| Document | Purpose |
|---|---|
| `DOCUMENTS/PRD.md` | Product requirements and acceptance criteria |
| `DOCUMENTS/ARCHITECTURE.md` | MERN/MVC architecture reference |
| `DOCUMENTS/DATABASE.md` | Schema specification |
| `DOCUMENTS/API_SPEC.md` | API endpoint reference |
| `DOCUMENTS/DECISIONS_AND_CONFLICTS.md` | Unresolved source conflicts and proposed defaults |
| `DOCUMENTS/SETUP_AND_DEVELOPMENT_GUIDE.md` | Detailed build stages |
| `DOCUMENTS/TESTING.md` | Test plan and evidence log |

---

## Environment variables reference

### Backend (`server/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Express server port | `8001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/hotel` |
| `JWT_SECRET` | JWT signing secret — keep private | *(none — required)* |
| `ADMIN_NAME` | Administrator display name | `System Administrator` |
| `ADMIN_EMAIL` | Admin login email — **required for seeding** | *(none — set in .env)* |
| `ADMIN_PASSWORD` | Admin password — **required for seeding** | *(none — set in .env)* |
| `ADMIN_PHONE` | Admin phone number | `1234567890` |

### Frontend (`client/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8001` |

---

## Troubleshooting

| Problem | Check |
|---|---|
| Backend won't start | Confirm MongoDB is running; check `MONGO_URI` in `server/.env` |
| Frontend can't reach backend | Confirm `VITE_API_BASE_URL` matches backend port; check CORS `CLIENT_ORIGIN` |
| `npm install` fails | Verify Node.js version ≥ 16; delete `node_modules/` and retry |
| Login always fails | Check email normalisation and password hash comparison (Stage B) |
| Admin tabs empty | Verify admin account seeded (`npm run seed:admin` in `server/`) and protected endpoints accessible |
| Room list empty | Run `npm run seed:rooms` from `server/` to populate the demo room catalogue |
| Tests fail with concurrency errors | Ensure you run `npm test` from the **root** (uses `--test-concurrency=1`) |
| Last-admin demotion blocked | The system prevents the sole admin from being demoted — add a second admin first |

---

## Implementation status

| Stage / Phase | Description | Status |
|---|---|---|
| A | Scaffold + infrastructure | ✅ Completed |
| B | Authentication (User model, JWT) | ✅ Completed |
| C | Rooms and bookings | ✅ Completed |
| D | Full frontend UI | ✅ Completed |
| Ph1 | Room availability & response safety hardening | ✅ Completed |
| Ph2 | Customer experience — room discovery, booking workflow, history categories | ✅ Completed |
| Ph3 | Admin operations — live metrics, room/booking/user management | ✅ Completed |
| Ph4 | Final quality audit — last-admin safeguard, 113 passing tests, submission readiness | ✅ Completed |

---

## Submission

- **GitHub repository:** https://github.com/AlfinTG/HotelPro
- **Demo video:** *(to be recorded — see checklist below)*

See [`DOCUMENTS/DEMO_AND_SUBMISSION.md`](./DOCUMENTS/DEMO_AND_SUBMISSION.md) for the full submission checklist.
