# SplitBill — Split-Bill & Group Expense Tracker

A college-level full-stack web application that helps groups of friends, flatmates, or trip members record shared expenses, see who owes whom, and settle up efficiently.

---

## Features

- Register and log in securely with JWT authentication
- Create expense groups and invite members with a unique code
- Add shared expenses with equal or custom splits (stored in integer paise)
- Edit and delete expenses (creator permission)
- Search and filter expenses by group, category, and payer
- View dynamically calculated member balances (no stored balances table)
- Get practical greedy settlement suggestions
- Record settlement payments and view history
- Group chat with persistent messages and manual refresh
- In-app notifications for group events
- Group activity feed showing expense and settlement events

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, Vue Router, Tailwind CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MySQL |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| HTTP | Native `fetch()` — no Axios |

---

## Local Setup (Windows)

### Prerequisites
- Node.js v18 or later
- npm
- MySQL Server (local or remote)

---

### 1. Clone / Download
Place the project folder at a known location. These instructions assume:
```
c:\Users\YourName\Downloads\split-bill-expense-tracker\
```

---

### 2. MySQL Database Setup

Open MySQL Workbench, MySQL Shell, or the command-line client.

```sql
-- Run the full schema (safe to rerun — uses CREATE TABLE IF NOT EXISTS)
source c:/Users/YourName/Downloads/split-bill-expense-tracker/database/schema.sql;
```

Or in MySQL Shell / terminal:
```powershell
mysql -u root -p < database\schema.sql
```

This creates the `split_bill_tracker` database with all required tables.

---

### 3. Backend Setup

```powershell
cd server
npm.cmd install
```

Copy the example environment file and fill in your credentials:
```powershell
copy .env.example .env
```

Edit `server/.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=split_bill_tracker
DB_SSL=false
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the backend (development mode with auto-restart):
```powershell
npm.cmd run dev
```

Or production mode:
```powershell
npm.cmd start
```

The server starts on `http://localhost:5000`.

---

### 4. Frontend Setup

Open a second terminal window:
```powershell
cd client
npm.cmd install
```

Copy the example environment file:
```powershell
copy .env.example .env
```

`client/.env` default content (correct for local):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```powershell
npm.cmd run dev
```

Open `http://localhost:5173` in your browser.

---

## Build & Test Commands

**Run Phase 5 unit tests (financial logic — no DB required):**
```powershell
cd server
node test-phase5.js
```

**Build the frontend for production:**
```powershell
cd client
npm.cmd run build
```
Output goes to `client/dist/`. Last confirmed result: 1765 modules, exit code 0.

---

## API Summary (23 Endpoints)

| Group | Count | Examples |
|-------|-------|---------|
| Auth | 3 | POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me` |
| Groups | 5 | GET/POST `/api/groups`, GET/PUT `/api/groups/:id`, POST `/api/groups/join` |
| Expenses | 4 | GET `/api/expenses`, POST/PUT/DELETE `/api/groups/:id/expenses` or `/api/expenses/:id` |
| Balances & Settlements | 4 | GET `.../balances`, GET `.../settlements/suggestions`, GET/POST `.../settlements` |
| Chat | 2 | GET/POST `/api/groups/:id/messages` |
| Notifications | 3 | GET `/api/notifications`, PUT `.../read`, PUT `.../read-all` |
| Activity | 1 | GET `/api/groups/:id/activity` |
| Health | 1 | GET `/api/health` |

See `docs/API_AND_FUNCTIONS.md` for the complete list with authentication requirements and controller file references.

---

## Deployment Overview

The project deploys across three separate services:

| Service | What it hosts |
|---------|--------------|
| **Vercel** | `client/` — Vue 3 frontend |
| **Render** | `server/` — Express backend |
| **Aiven** | MySQL database |

See `docs/DEPLOYMENT_GUIDE.md` for full step-by-step instructions.

> **Free-tier note:** Render's free tier spins down services after 15 minutes of inactivity. The first request after idle may take 30–60 seconds to respond (cold start).

---

## Project Documentation

| File | Contents |
|------|---------|
| `docs/API_AND_FUNCTIONS.md` | All 23 APIs and 89 custom functions with descriptions |
| `docs/PHASE_PROGRESS.md` | Phase-by-phase development history |
| `docs/PROJECT_STRUCTURE.md` | Directory and file layout |
| `docs/DEPLOYMENT_GUIDE.md` | Manual deployment guide |
| `docs/VIVA_GUIDE.md` | Viva Q&A preparation |

---

## Public Routes

- `/login`
- `/signup`

## Protected Routes (require login)

- `/dashboard` — Balances summary, active groups, recent expenses
- `/groups` — Group management, invite codes, activity feed modal
- `/expenses` — Expense tracking and split management
- `/balances` — Member balances, greedy suggestions, settlement recording
- `/chat` — Persistent group chat with manual refresh
- `/notifications` — In-app notifications with read-status management
