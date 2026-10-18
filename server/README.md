# Server Documentation

This folder contains the Express backend for the Split-Bill & Group Expense Tracker, built with Node.js, Express, and MySQL (`mysql2/promise`).

### Current Status: Phase 6 Completed
The backend exposes **23 REST APIs** supporting:
- Authentication & JWT profile extraction (`/api/auth`)
- Groups and membership management (`/api/groups`)
- Expenses and integer-paise split transactions (`/api/groups/:groupId/expenses`, `/api/expenses/:expenseId`)
- Dynamic net balances and greedy settlement suggestions (`/api/groups/:groupId/balances`, `/api/groups/:groupId/settlements/suggestions`)
- Recorded settlements (`/api/groups/:groupId/settlements`)
- Group messaging (`/api/groups/:groupId/messages`)
- In-app notifications with unread tracking (`/api/notifications`)
- Group activity auditing (`/api/groups/:groupId/activity`)

### Getting Started

Before running the server, ensure MySQL is running locally and your database has been initialized with `database/schema.sql`.

**Dependency Installation:**
```powershell
npm.cmd install
```

**Environment Variables:**
Duplicate `.env.example` to `.env` and set your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=split_bill_db
JWT_SECRET=your_jwt_secret_key
```

**Start Development Server:**
```powershell
npm.cmd run dev
```
(Defaults to `http://localhost:5000/api`)

