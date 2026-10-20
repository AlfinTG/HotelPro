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

### 5. Start MongoDB

Ensure MongoDB is running locally before starting the backend:

```bash
# macOS / Linux (if installed via Homebrew)
brew services start mongodb-community

# Windows (if installed as a service)
net start MongoDB

# Or start mongod directly
mongod --dbpath /path/to/data/db
```

### 6. Start the servers

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

## Production build

```bash
cd client
npm run build
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
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

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
| Admin tabs empty | Verify admin account seeded and protected endpoints accessible (Stage B+) |

---

## Implementation status

| Stage | Description | Status |
|---|---|---|
| A | Scaffold + infrastructure | ✅ Completed |
| B | Authentication (User model, JWT) | ✅ Completed |
| C | Rooms and bookings | ✅ Completed |
| D | Full frontend UI | ✅ Completed |
| E | Verification and submission | ✅ Completed |

---

## Submission

- **GitHub repository:** https://github.com/AlfinTG/HotelPro
- **Demo video:** *(to be recorded after Stage E)*

See [`DOCUMENTS/DEMO_AND_SUBMISSION.md`](./DOCUMENTS/DEMO_AND_SUBMISSION.md) for the full submission checklist.
