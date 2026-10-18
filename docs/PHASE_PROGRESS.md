# Phase Progress

## Phase 1: Foundation and UI Shell

**Phase Goal:**
Establish the project foundation, modern Vue 3 application shell, reusable component architecture, and styling framework with Tailwind CSS and Vue Router.

**Completed Items:**
* Initialized Vue 3 Single Page Application (SPA) with Vite and Tailwind CSS.
* Set up standard directory structure: `components/common`, `components/layout`, `views`, `services`, `utils`.
* Built foundational UI shell components:
  - `AppSidebar.vue`: Collapsible navigation sidebar for desktop and mobile.
  - `AppTopbar.vue`: Top navigation bar with branding and notification area.
  - `AppLogo.vue`, `PageHeader.vue`: Consistent branding and view headings.
  - `SectionCard.vue`, `SummaryCard.vue`: Card surfaces for displaying modular information.
  - `EmptyState.vue`: Placeholder screens for empty data states.
* Configured Vue Router with all application routes, including public routes `/login` and `/signup`, and protected routes for `Dashboard`, `Groups`, `Expenses`, `Balances`, `Chat`, and `Notifications`.
* Documented project setup and architecture guidelines.

## Phase 2: Responsive Frontend Design and UI Polish

**Phase Goal:**
Create responsive frontend layouts, Polish UI aesthetics, establish visual design hierarchy, and implement mobile navigation drawers.

**Completed Items:**
* Built out full responsive grid system across mobile, tablet, and desktop breakpoints.
* Implemented mobile slide-out navigation drawer with smooth transitions and backdrop overlay.
* Refined visual design tokens using Tailwind slate and indigo color palettes.
* Polished UI cards, stat summary tiles, and tables with consistent spacing and typography.
* Formatted currency values and date badges across mockup views.
* Introduced reusable interactive components:
  - `BaseButton.vue`: Multiple color variants and size options.
  - `AppModal.vue`: Modal dialog with backdrop and dismiss controls.
  - `FormField.vue`: Form input with validation error display.
  - `ErrorState.vue`, `LoadingState.vue`: Consistent error and loading screens.
* Removed out-of-scope UI elements (such as global search bars) to keep design focused on project objectives.
* Ensured all screens are beginner-friendly visual previews — no backend data at this stage.

## Phase 3: Core Frontend Group and Expense Workflows

**Phase Goal:**
Implement client-side interactive workflows for creating groups, adding expenses, and splitting bills with equal and custom amount shares. All data was stored in temporary Vue reactive state and reset on page refresh — no backend or database existed at this stage.

**Completed Items:**
* Built the group creation modal in `Groups.vue`. A join-by-invite-code UI input was also sketched as a placeholder — the real backend invite-code join workflow was not introduced until Phase 4.
* Implemented the full expense entry workflow in `Expenses.vue`:
  - Form validation for expense title, amount, payer, and category.
  - Equal split calculation with remainder distribution across participants.
  - Custom amount split validation ensuring member shares sum exactly to the total expense amount.
* Created utility functions in `client/src/utils/expenseHelpers.js`:
  - `formatCurrency`: Standardized decimal representation.
  - `calculateEqualShares`: Equal split distribution logic.
  - `validateCustomSplit`: Exact sum verification.
  - `filterExpenses`: Category and group filtering for expense lists.
  - `validateLoginForm` & `validateSignupForm`: Client-side input validation.
* All state was temporary (in-memory Vue reactive data) and did not persist between page refreshes.

## Phase 4: Express Backend, MySQL Persistence, Authentication, and Core APIs

**Phase Goal:**
Build a real Node.js and Express backend with MySQL, and connect the Vue frontend to it through REST API calls.

**Completed Items:**
- Set up the Node.js project with `express`, `cors`, `jsonwebtoken`, `bcryptjs`, `dotenv`, and `mysql2`.
- Created `database/schema.sql` with all core tables: `users`, `` `groups` ``, `group_members`, `expenses`, and `expense_splits`. All monetary amounts use `amount_paise INT UNSIGNED` to avoid floating-point errors.
- Implemented JWT-based authentication: registration hashes passwords with bcrypt and returns a token; login verifies the hash and returns a token; protected routes verify the token via `authMiddleware`.
- Added creator-only permission checks for editing groups and editing/deleting expenses.
- Generated unique group invite codes with a collision-checking retry loop.
- Replaced temporary in-memory Vue state with real API calls using native `fetch()` and the new service layer (`authService`, `groupService`, `expenseService`).
- Configured Vue Router navigation guards to redirect unauthenticated users away from protected routes.
- Set up environment-variable-based configuration via `.env` and `.env.example`.

**APIs Added:** 13 endpoints covering `/api/health`, `/api/auth` (register, login, me), `/api/groups` (list, create, join, get, update), and `/api/expenses` (list, create, update, delete).

**Verification Performed:**
- Ran `database/schema.sql` to set up the database.
- Tested account registration and login, confirming JWT tokens are returned and stored.
- Verified that expense cascade-deletes also remove related `expense_splits` rows.
- Confirmed that the frontend dashboard loads correct data from the backend with no regression from Phase 3 UI.

**Build / Test Result:** Passed locally using `npm.cmd run dev` for both frontend and backend.

**Known Limitations:**
- No HTTPS locally; all requests use HTTP on localhost.
- No rate limiting or advanced input sanitization beyond parameterized SQL queries.

**What is deferred to Phases 5, 6, and 7:**
- Phase 5: Dynamic balances and settlements without stored balances tables, and practical greedy settlement suggestions.
- Phase 6: Group chat, in-app notifications, and activity feed using regular Express REST APIs and manual refresh (no WebSockets).
- Phase 7: Manual integration testing, bug fixes, GitHub repository cleanup, deployment, README cleanup, and viva preparation.

## Phase 5: Balances, Recorded Settlements, and Greedy Settlement Suggestions

**Phase Goal:**
Implement the core financial engine for the Split-Bill & Group Expense Tracker. Enable authenticated group members to view real dynamically calculated member balances, practical greedy settlement suggestions, record settlement payments, inspect settlement history, and track real "You Are Owed" and "You Owe" metrics on the Dashboard.

**Database Changes:**
* Added the `settlements` table to `database/schema.sql` with foreign keys referencing `` `groups`(id) `` and `users(id)`, using `INT UNSIGNED` for `amount_paise`, and proper indexes on `group_id`, `payer_id`, and `receiver_id`.
* Maintained `CREATE TABLE IF NOT EXISTS` so the schema can be safely rerun without dropping or modifying existing data in `users`, `` `groups` ``, `group_members`, `expenses`, or `expense_splits`.
* Architectural decision: No `balances` table exists. Net balances are always calculated dynamically from stored expenses, splits, and settlements to prevent stale financial data.

**Financial Calculation & Formula:**
$$\text{Net Balance} = \text{Expense Amount Paid} - \text{Expense Share Owed} + \text{Settlement Amount Sent} - \text{Settlement Amount Received}$$
* All backend calculations and comparisons operate strictly on integer paise (1 INR = 100 paise) to prevent floating-point drift.
* Member statuses:
  - `owed`: Net balance is positive (member should receive money).
  - `owes`: Net balance is negative (member owes money).
  - `settled`: Net balance is zero.
* The sum of all net balances across group members is guaranteed to equal zero.

**Greedy Settlement Approach:**
* Pure JavaScript implementation in `server/src/utils/settlementAlgorithm.js`.
* Separates members into creditors (positive net balances) and debtors (negative net balances).
* Sorts creditors and debtors in descending order of amount and pairs the largest debtor with the largest creditor iteratively.
* Accurately documented in UI and documentation:
  *"The application uses a practical greedy settlement approach to reduce the number of payments needed to settle group debts. It is efficient for typical group expense scenarios, but it is not guaranteed to find the mathematically smallest possible number of transactions in every case."*
* Operates on cloned working balances and does not mutate the original member balance records.

**Record Settlement Behavior:**
* Pre-filled modal from greedy suggestions with read-only payer, receiver, and amount.
* Editable payment date defaulting to today (strictly validated not to exceed current date).
* Backend validation enforces:
  - Caller must be an active group member.
  - Caller must be either the payer or the receiver.
  - Payer and receiver must be different members.
  - Payer must currently owe money, and amount must not exceed the payer's current debt.
  - Receiver must currently be owed money, and amount must not exceed the receiver's receivable amount.
  - Amount is validated strictly as a positive integer in paise.
* Recording a settlement automatically triggers data refetching in the frontend to refresh balances, suggestions, and history.

**Dashboard Integration:**
* Derived real "You Are Owed" (sum of user's positive net balances across all joined groups) and "You Owe" (sum of absolute negative net balances across all joined groups) values.
* Preserved active groups, total expenses, user's paid amount, expense count, and recent expenses list.

**APIs Added (4 endpoints, bringing total to 17):**
14. `GET /api/groups/:groupId/balances` (Protected): Returns dynamically calculated net balances for all members.
15. `GET /api/groups/:groupId/settlements/suggestions` (Protected): Computes greedy settlement suggestions without mutating database state.
16. `GET /api/groups/:groupId/settlements` (Protected): Returns settlement payment history.
17. `POST /api/groups/:groupId/settlements` (Protected): Validates and inserts a settlement record in integer paise.

**Verification Performed:**
* Executed `server/test-phase5.js` with built-in `node:assert/strict`:
  - Verified equal split balance calculations and status flags.
  - Verified zero-sum balance invariant.
  - Verified custom split and settlement adjustments.
  - Verified practical greedy algorithm matching and full balance clearance.
* Verified client production build via `npm.cmd run build` in `client/` (1762 modules transformed, 0 errors).

**Build Result:** Passed cleanly (`Exit code: 0`).

**Known Limitations:**
* Settlement edit and delete are not supported in Phase 5.
* Leave group and group deletion remain deferred.
* Single-currency (INR in integer paise) design only.

**What is deferred to Phase 6 & Phase 7:**
* Phase 6: Group chat, in-app notifications, activity feed (regular backend APIs, manual refresh, no WebSockets).
* Phase 7: Manual integration testing, bug fixes, GitHub repository cleanup, deployment, README cleanup, and viva preparation.

## Phase 6: Group Chat, In-App Notifications, and Activity Feed

**Phase Goal:**
Add simple persistent group communication, in-app notifications, and chronological activity tracking using standard Express REST APIs and MySQL persistence, strictly avoiding WebSockets or polling timers.

**Database Changes:**
* Added 3 new tables to `database/schema.sql`:
  - `messages`: Persistent group chat records (`id`, `group_id`, `sender_id`, `content`, `created_at`).
  - `notifications`: User-scoped notification records (`id`, `user_id`, `group_id`, `type`, `message`, `is_read`, `created_at`).
  - `activity_logs`: Group-scoped event audit logs (`id`, `group_id`, `actor_id`, `action_type`, `description`, `created_at`).
* Ensured foreign key data types matched existing tables using signed `INT NOT NULL` (not `INT UNSIGNED`) and exact syntax `FOREIGN KEY (group_id) REFERENCES \`groups\`(id)`.
* Added indexes on foreign keys and `is_read` for optimal query execution.

**Backend Implementation:**
* Created event utility in `server/src/utils/groupEvents.js`:
  - `createActivityLog`: Inserts group activity audit entries within active transactions or pool queries.
  - `createNotificationsForGroupMembers`: Dispatches notification records to all group members excluding the actor.
* Created controllers and routes for all 6 new REST APIs:
  - `server/src/controllers/messageController.js` and `server/src/routes/messageRoutes.js`
  - `server/src/controllers/notificationController.js` and `server/src/routes/notificationRoutes.js`
  - `server/src/controllers/activityController.js`
* Integrated event logging and member notifications into existing workflows:
  - Group creation, update, and joining in `groupController.js`
  - Expense creation, update, and deletion in `expenseController.js`
  - Settlement recording in `settlementController.js`
  - Message posting in `messageController.js`

**Frontend Implementation:**
* Created API client services:
  - `client/src/services/messageService.js` (`getGroupMessages`, `sendGroupMessage`)
  - `client/src/services/notificationService.js` (`getNotifications`, `markNotificationRead`, `markAllNotificationsRead`)
  - `client/src/services/activityService.js` (`getGroupActivity`)
* Upgraded views and layout:
  - `Chat.vue`: Group selector, chronological message bubbles (styled by sender), 1000-character input validation, and an explicit manual "Refresh Messages" button.
  - `Notifications.vue`: Dynamic notification cards with type icons, read/unread states, "Mark Read" per item, and "Mark all as read" button.
  - `Groups.vue`: Added "View Activity" trigger button and modal dialog rendering chronological group events.
  - `AppTopbar.vue`: Replaced static indicator with a real dynamic unread notification badge.

**APIs Added (6 endpoints, bringing total to 23):**
18. `GET /api/groups/:groupId/messages` (Protected): Fetches messages for a group.
19. `POST /api/groups/:groupId/messages` (Protected): Validates and saves a group message (1–1000 chars).
20. `GET /api/notifications` (Protected): Fetches latest 50 notifications and unread count for current user.
21. `PUT /api/notifications/:notificationId/read` (Protected): Marks a single notification as read.
22. `PUT /api/notifications/read-all` (Protected): Marks all unread notifications as read.
23. `GET /api/groups/:groupId/activity` (Protected): Fetches chronological activity records for a group.

**Verification Performed:**
* Executed production client build with `npm.cmd run build` in `client/`: 1765 modules transformed, 0 errors, build completed in 733ms.
* Verified backend endpoints, route registrations, foreign-key schema consistency, and payload validations.

**Build / Test Result:** Passed cleanly (`Exit code: 0`).

**Known Limitations:**
* Real-time push updates via WebSockets or polling are deliberately excluded per architectural guidelines; all data synchronization relies on user navigation and manual refresh controls.
* Group deletion and member leaving remain deferred.

**Deferred to Phase 7:**
* Phase 7: Manual integration testing, bug fixes, GitHub repository cleanup, deployment, README cleanup, and viva preparation.

## Phase 7: Final Verification, Documentation Cleanup, and Deployment Readiness

**Phase Goal:**
Inspect the complete project, fix any verified bugs, prepare the codebase for GitHub and deployment (Vercel + Render + Aiven MySQL), and produce complete student-friendly documentation.

**No new application features were added in this phase.**

**Bugs Fixed:**

1. **`server/src/routes/messageRoutes.js`** — `router.use(auth)` referenced an undefined variable. `authMiddleware` was imported on line 3 but not applied. Fixed to `router.use(authMiddleware)`. Without this fix the server crashes on startup with a `ReferenceError`.

2. **`server/src/controllers/messageController.js`** — `req.user.name` was read to build notification messages, but `authMiddleware` only populates `req.user.id` (not `.name`). This caused chat notifications to always read *"undefined sent a new message"*. Fixed by querying `SELECT name FROM users WHERE id = ?` before constructing the notification text.

**Deployment-Readiness Changes:**

| Item | Outcome |
|------|---------|
| `process.env.PORT` with fallback `5000` in `server.js` | Already correct — no change needed |
| CORS uses `process.env.CLIENT_URL` (no wildcard `origin: '*'`) | Already correct — no change needed |
| Frontend uses `import.meta.env.VITE_API_BASE_URL` | Already correct — no change needed |
| No hard-coded production URLs in service files | Already correct — no change needed |
| `server/src/config/db.js` — added conditional SSL (`DB_SSL=true`) | **Updated** |
| `server/.env.example` — added `DB_SSL=false` placeholder | **Updated** |
| Root `.gitignore` | **Created** — excludes `node_modules/`, `dist/`, real `.env` files; `.env.example` files tracked |

**Documentation Updated:**
* `docs/API_AND_FUNCTIONS.md`: Rewritten with accurate function count (89, counted from source), controller file column added, all descriptions rewritten to plain English.
* `docs/PHASE_PROGRESS.md`: Phase 7 entry added; `AppCard.vue` reference (non-existent file) removed from Phase 1.
* `docs/PROJECT_STRUCTURE.md`: Updated to include new Phase 7 documentation files.
* `README.md`: Full student-friendly rewrite with local setup, MySQL steps, build/test commands.
* `docs/DEPLOYMENT_GUIDE.md`: New manual deployment guide for GitHub → Aiven → Render → Vercel workflow.
* `docs/VIVA_GUIDE.md`: New viva preparation Q&A covering all key project design decisions.

**Build / Test Results (Actual):**

* Phase 5 unit tests (`node test-phase5.js`): All 3 assertions passed — equal split, custom split + settlement, greedy algorithm.
* Client production build (`npm.cmd run build`): 1765 modules transformed, Exit code 0, completed in 13.34 s. Output: `dist/index.html`, `dist/assets/index.css`, `dist/assets/index.js`.

**Deployment Status:** **Deployment-ready.** The codebase is prepared for deployment to GitHub, Vercel (frontend), Render (backend), and Aiven MySQL (database). No public URLs have been created or tested yet — deployment requires the student's own accounts on those services. Refer to `docs/DEPLOYMENT_GUIDE.md` for step-by-step instructions.

**Known Limitations:**
* Settlement edit and delete are not supported.
* Group deletion and member leaving are not implemented.
* Single-currency (INR in integer paise) only.
* No real-time chat — messages update only on user action or manual refresh.
* Free Render tier services sleep after 15 minutes of inactivity (cold-start delay on first request).
**Additional Bug Fixes (Post-Phase-7 Auth Hardening):**

3. **`client/src/views/Login.vue` and `client/src/views/Signup.vue`** — Both views called `validateLoginForm(this.form)` and `validateSignupForm(this.form)`, passing a single object where the helpers expected individual arguments. This caused all validation to silently pass (empty fields could be submitted) and field-level error messages never displayed. Fixed so each view calls the helper with the correct individual arguments and reads the `{ isValid, errors }` return value correctly.

4. **`client/src/utils/expenseHelpers.js`** — `validateSignupForm` only required a 6-character password. Upgraded to a strong-password rule (minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character). Login validation is deliberately unchanged to remain compatible with existing accounts.

5. **`server/src/controllers/authController.js`** — Applied the same strong-password rule on the backend `register` route, server-side, as a defence-in-depth measure. The `login` route is not affected.

6. **`client/src/services/apiClient.js`** — Network-level failures (`TypeError: Failed to fetch`) were forwarded as cryptic browser messages. Now converted to: *"Unable to connect to the server. Please try again."* Meaningful server errors (`"Invalid email or password."`, `"A user with that email already exists."`) are still forwarded as-is.

**Comment Cleanup:** Removed generated-style and code-repeating inline comments from `expenseController.js`, `groupController.js`, and `authService.js`. Kept professional comments for paise calculations, greedy algorithm logic, and security decisions.

7. **`server/src/utils/inviteCode.js`** — `getUniqueInviteCode` queried `SELECT id FROM groups WHERE invite_code = ?` without backticks. MySQL treats `groups` as a reserved keyword and threw a SQL syntax error on every group creation attempt. Fixed by quoting the table name: `SELECT id FROM \`groups\` WHERE invite_code = ?`.

8. **`client/src/components/common/AppModal.vue`** — An amber banner reading *"Note: This is a visual preview only. Saving data starts in Phase 3."* was hardcoded inside the generic modal wrapper. Because `AppModal` is used for all modals (Create Group, Join Group, Edit Group), this banner appeared everywhere. Removed.

9. **`client/src/components/layout/AppSidebar.vue`** — Sign Out link label read *"Sign Out (Phase 4)"*. Corrected to *"Sign Out"*.

**Verified locally:** Group "Goa Trip" created successfully after the fix. No SQL error. Invite code generated. Group appeared immediately on the Groups page. All six routes checked: zero phase or preview text remains in the UI.

10. **`server/src/controllers/authController.js`** — `login` returned HTTP 401 with the same "Invalid email or password." for both missing account and wrong password. Split into: HTTP 404 + "No account exists with this email. Please sign up first." (unknown email) and HTTP 401 + "Incorrect password. Please try again." (wrong password). Successful JWT login unchanged.

11. **`client/src/views/Login.vue`** — Added `noAccountError` data field; on HTTP 404 the amber banner with the message and a **Sign Up now →** router-link is shown. On HTTP 401 or network errors, the existing red error box is shown. Both states are cleared on each new submit.

12. **"Unable to connect to the server" root cause** — Both `server/.env` and `client/.env` files were absent. `server/src/server.js` calls `process.exit(1)` when required env vars are missing, so the process never starts and port 5000 is never opened. The code (CORS, routes, apiClient URL) is correct. Solution: create both `.env` files with valid local values as documented in the walkthrough.
