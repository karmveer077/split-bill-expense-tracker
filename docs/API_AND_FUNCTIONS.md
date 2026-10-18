# API and Custom Functions Documentation

**Current Phase:** Phase 7 — Final Verification, Documentation Cleanup, and Deployment Readiness

---

## Backend APIs

**Total backend APIs implemented: 23**

| Method | Endpoint | Access | Controller File | One-line Purpose |
|--------|----------|--------|-----------------|------------------|
| `GET` | `/api/health` | Public | `app.js` (inline) | Returns a health status message confirming the backend is reachable. |
| `POST` | `/api/auth/register` | Public | `authController.js` | Creates a user account, hashes the password with bcrypt, and returns a JWT. |
| `POST` | `/api/auth/login` | Public | `authController.js` | Validates credentials and returns a JWT on success. |
| `GET` | `/api/auth/me` | Protected | `authController.js` | Returns the authenticated user's safe profile (id, name, email). |
| `GET` | `/api/groups` | Protected | `groupController.js` | Returns all groups the current user belongs to, with basic metrics. |
| `POST` | `/api/groups` | Protected | `groupController.js` | Creates a new group and adds the creator as the first member via a DB transaction. |
| `GET` | `/api/groups/:groupId` | Protected | `groupController.js` | Returns a specific group and its member list (caller must be a member). |
| `PUT` | `/api/groups/:groupId` | Protected | `groupController.js` | Updates group name and description (creator only). |
| `POST` | `/api/groups/join` | Protected | `groupController.js` | Adds the caller as a member using a unique invite code. |
| `GET` | `/api/expenses` | Protected | `expenseController.js` | Returns all expenses in groups the current user belongs to. |
| `POST` | `/api/groups/:groupId/expenses` | Protected | `expenseController.js` | Creates an expense with equal or custom splits stored in integer paise. |
| `PUT` | `/api/expenses/:expenseId` | Protected | `expenseController.js` | Updates an expense and recalculates splits (creator only). |
| `DELETE` | `/api/expenses/:expenseId` | Protected | `expenseController.js` | Deletes an expense and cascades to remove its splits (creator only). |
| `GET` | `/api/groups/:groupId/balances` | Protected | `balanceController.js` | Dynamically calculates and returns net balances for all group members. |
| `GET` | `/api/groups/:groupId/settlements/suggestions` | Protected | `balanceController.js` | Returns practical greedy settlement suggestions without changing any DB data. |
| `GET` | `/api/groups/:groupId/settlements` | Protected | `settlementController.js` | Returns recorded settlement payment history for a group. |
| `POST` | `/api/groups/:groupId/settlements` | Protected | `settlementController.js` | Validates and records a settlement payment between two group members. |
| `GET` | `/api/groups/:groupId/messages` | Protected | `messageController.js` | Returns stored messages for a group in chronological order. |
| `POST` | `/api/groups/:groupId/messages` | Protected | `messageController.js` | Saves a group message (1–1000 characters) and notifies other members. |
| `GET` | `/api/notifications` | Protected | `notificationController.js` | Returns the user's latest 50 notifications and their unread count. |
| `PUT` | `/api/notifications/:notificationId/read` | Protected | `notificationController.js` | Marks a single notification belonging to the caller as read. |
| `PUT` | `/api/notifications/read-all` | Protected | `notificationController.js` | Marks all of the caller's unread notifications as read. |
| `GET` | `/api/groups/:groupId/activity` | Protected | `activityController.js` | Returns chronological activity log entries for a group (newest first). |

---

## Core Architecture Notes

**Dynamic Balances (No Stored Table):** The database has no `balances` table. Net balances are computed dynamically from `expenses`, `expense_splits`, and `settlements` each time they are requested. This prevents stale data.

**Balance Formula:**
```
Net Balance = Expense Amount Paid − Expense Share Owed + Settlement Sent − Settlement Received
```
- Positive → member should receive money (`owed`)
- Negative → member owes money (`owes`)
- Zero → member is settled (`settled`)
- The sum of all member net balances in a group is always zero.

**Practical Greedy Settlement Algorithm:** Implemented in `server/src/utils/settlementAlgorithm.js`. Separates members into creditors and debtors, sorts both descending by amount, and pairs the largest debtor with the largest creditor iteratively. Works well for typical group scenarios but is not guaranteed to produce the globally minimum number of transactions in every case.

**Communication Architecture:** Group messages, notifications, and activity logs use standard Express REST APIs with MySQL persistence. No WebSockets, Socket.IO, polling timers, or real-time servers. Chat and notifications update when the user navigates or manually refreshes.

**Logout:** Handled entirely on the client by clearing the JWT token and user object from `localStorage`. There is no `/api/auth/logout` endpoint because JWTs are stateless.

---

## Custom JavaScript Functions

**Total important custom functions documented: 89**

*Excludes Vue built-ins (lifecycle hooks, watchers), imported library functions, and the `request` helper in `apiClient.js`.*

### Server — Utilities

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `generateInviteCode` | `server/src/utils/inviteCode.js` | 4 | Generates a random 8-character uppercase alphanumeric string. |
| `getUniqueInviteCode` | `server/src/utils/inviteCode.js` | 4 | Retries code generation (up to 10 attempts) until a non-colliding code is confirmed in the DB. |
| `rupeesToPaise` | `server/src/utils/money.js` | 4 | Converts a rupee float to an integer paise value using `Math.round` to eliminate floating-point drift. |
| `paiseToRupees` | `server/src/utils/money.js` | 4 | Converts an integer paise value to a formatted rupee string with two decimal places. |
| `calculateEqualSharesPaise` | `server/src/utils/money.js` | 4 | Divides a total paise amount equally and returns the base share and integer remainder. |
| `isValidEmail` | `server/src/utils/validators.js` | 4 | Validates a string against a basic email pattern using a regular expression. |
| `throwError` | `server/src/utils/validators.js` | 4 | Creates an Error with a `statusCode` property and throws it for the error handler to catch. |
| `calculateMemberBalances` | `server/src/utils/balanceCalculator.js` | 5 | Computes each group member's net balance in integer paise using the project balance formula. |
| `calculateSettlementSuggestions` | `server/src/utils/settlementAlgorithm.js` | 5 | Runs the greedy matching algorithm on member balances to produce settlement suggestions without mutating the input. |
| `createActivityLog` | `server/src/utils/groupEvents.js` | 6 | Inserts one activity log record into `activity_logs` using a provided DB connection or pool. |
| `createNotificationsForGroupMembers` | `server/src/utils/groupEvents.js` | 6 | Inserts notification records for all group members except the acting user. |

### Server — Controllers

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `register` | `server/src/controllers/authController.js` | 4 | Validates input, hashes the password with bcrypt, inserts a new user, and returns a JWT. |
| `login` | `server/src/controllers/authController.js` | 4 | Compares the submitted password against the stored hash and returns a JWT on success. |
| `getMe` | `server/src/controllers/authController.js` | 4 | Reads the authenticated user's record from the DB and returns safe profile fields. |
| `getGroups` | `server/src/controllers/groupController.js` | 4 | Fetches all groups the caller belongs to with member counts and expense totals. |
| `createGroup` | `server/src/controllers/groupController.js` | 4 | Creates a group record and adds the creator as the first member in a single DB transaction. |
| `joinGroup` | `server/src/controllers/groupController.js` | 4 | Looks up a group by invite code and inserts a membership record for the caller. |
| `getGroupById` | `server/src/controllers/groupController.js` | 4 | Returns a single group's details and member list (membership check enforced). |
| `updateGroup` | `server/src/controllers/groupController.js` | 4 | Updates a group's name and description after verifying the caller is the creator. |
| `getExpenses` | `server/src/controllers/expenseController.js` | 4 | Returns all expenses across the caller's groups with split details. |
| `createExpense` | `server/src/controllers/expenseController.js` | 4 | Inserts an expense and its splits within a transaction, then logs activity and sends notifications. |
| `updateExpense` | `server/src/controllers/expenseController.js` | 4 | Replaces an expense's data and splits in a transaction (creator only), then logs activity. |
| `deleteExpense` | `server/src/controllers/expenseController.js` | 4 | Deletes an expense; splits cascade automatically via `ON DELETE CASCADE`. |
| `checkMembership` | `server/src/controllers/balanceController.js` | 5 | Queries `group_members` to confirm a user is an active member of a group. |
| `fetchGroupBalancesData` | `server/src/controllers/balanceController.js` | 5 | Aggregates paid, owed, and settled amounts from the DB and calls `calculateMemberBalances`. |
| `getGroupBalances` | `server/src/controllers/balanceController.js` | 5 | Handles GET `/api/groups/:groupId/balances` and returns calculated member balances. |
| `getSettlementSuggestions` | `server/src/controllers/balanceController.js` | 5 | Handles GET `.../settlements/suggestions` and returns greedy suggestions from current balances. |
| `getSettlements` | `server/src/controllers/settlementController.js` | 5 | Returns settlement payment history for a group with payer and receiver names. |
| `createSettlement` | `server/src/controllers/settlementController.js` | 5 | Validates balance constraints and inserts a settlement record in integer paise. |
| `getGroupMessages` | `server/src/controllers/messageController.js` | 6 | Returns all messages for a group in chronological order (membership check enforced). |
| `sendGroupMessage` | `server/src/controllers/messageController.js` | 6 | Validates content (1–1000 chars), saves a message, and notifies other group members. |
| `getNotifications` | `server/src/controllers/notificationController.js` | 6 | Returns the caller's latest 50 notifications and their current unread count. |
| `markNotificationRead` | `server/src/controllers/notificationController.js` | 6 | Marks a single notification as read after verifying it belongs to the caller. |
| `markAllNotificationsRead` | `server/src/controllers/notificationController.js` | 6 | Sets `is_read = 1` for all unread notifications belonging to the caller. |
| `getGroupActivity` | `server/src/controllers/activityController.js` | 6 | Returns activity log entries for a group in reverse chronological order. |

### Client — Utility Functions (`client/src/utils/expenseHelpers.js`)

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `createTemporaryId` | `client/src/utils/expenseHelpers.js` | 3 | Generates a pseudo-random string ID prefix for temporary local records. |
| `formatCurrency` | `client/src/utils/expenseHelpers.js` | 3 | Formats a number to two decimal places as a string. |
| `calculateEqualShares` | `client/src/utils/expenseHelpers.js` | 3 | Divides an expense amount equally among participants and returns the per-person share and remainder. |
| `validateCustomSplit` | `client/src/utils/expenseHelpers.js` | 3 | Returns true when the sum of custom split amounts matches the total expense within a ₹0.01 tolerance. |
| `filterExpenses` | `client/src/utils/expenseHelpers.js` | 3 | Filters an expense array by search text, group, category, and payer. |
| `validateLoginForm` | `client/src/utils/expenseHelpers.js` | 3 | Accepts individual `email` and `password` arguments; validates email format and password presence; returns `{ isValid, errors }`. |
| `validateSignupForm` | `client/src/utils/expenseHelpers.js` | 3 | Accepts individual `name, email, password, confirmPassword` arguments; validates all fields including a strong-password rule (8+ chars, upper, lower, digit, special char); returns `{ isValid, errors }`. |

### Client — API Service Functions

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `register` | `client/src/services/authService.js` | 4 | Calls POST `/auth/register`, stores the returned JWT and user in `localStorage`. |
| `login` | `client/src/services/authService.js` | 4 | Calls POST `/auth/login`, stores the returned JWT and user in `localStorage`. |
| `getCurrentUser` | `client/src/services/authService.js` | 4 | Calls GET `/auth/me` to verify the current session token against the server. |
| `logout` | `client/src/services/authService.js` | 4 | Removes the token and user object from `localStorage`. |
| `getLocalUser` | `client/src/services/authService.js` | 4 | Parses and returns the user object stored in `localStorage` without a network call. |
| `getGroups` | `client/src/services/groupService.js` | 4 | Calls GET `/groups` to fetch all groups for the current user. |
| `createGroup` | `client/src/services/groupService.js` | 4 | Calls POST `/groups` to create a new group. |
| `getGroupById` | `client/src/services/groupService.js` | 4 | Calls GET `/groups/:groupId` to fetch a specific group and its members. |
| `updateGroup` | `client/src/services/groupService.js` | 4 | Calls PUT `/groups/:groupId` to update group name and description. |
| `joinGroup` | `client/src/services/groupService.js` | 4 | Calls POST `/groups/join` to join a group by invite code. |
| `getExpenses` | `client/src/services/expenseService.js` | 4 | Calls GET `/expenses` to fetch all expenses visible to the current user. |
| `createExpense` | `client/src/services/expenseService.js` | 4 | Calls POST `/groups/:groupId/expenses` to create a new expense. |
| `updateExpense` | `client/src/services/expenseService.js` | 4 | Calls PUT `/expenses/:expenseId` to update an existing expense. |
| `deleteExpense` | `client/src/services/expenseService.js` | 4 | Calls DELETE `/expenses/:expenseId` to delete an expense. |
| `getGroupBalances` | `client/src/services/balanceService.js` | 5 | Calls GET `/groups/:groupId/balances` to fetch calculated member balances. |
| `getSettlementSuggestions` | `client/src/services/balanceService.js` | 5 | Calls GET `.../settlements/suggestions` to fetch greedy settlement suggestions. |
| `getSettlementHistory` | `client/src/services/settlementService.js` | 5 | Calls GET `/groups/:groupId/settlements` to fetch settlement payment history. |
| `createSettlement` | `client/src/services/settlementService.js` | 5 | Calls POST `/groups/:groupId/settlements` to record a settlement payment. |
| `getGroupMessages` | `client/src/services/messageService.js` | 6 | Calls GET `/groups/:groupId/messages` to fetch stored group messages. |
| `sendGroupMessage` | `client/src/services/messageService.js` | 6 | Calls POST `/groups/:groupId/messages` to send a new chat message. |
| `getNotifications` | `client/src/services/notificationService.js` | 6 | Calls GET `/notifications` to fetch the user's notifications and unread count. |
| `markNotificationRead` | `client/src/services/notificationService.js` | 6 | Calls PUT `/notifications/:id/read` to mark one notification as read. |
| `markAllNotificationsRead` | `client/src/services/notificationService.js` | 6 | Calls PUT `/notifications/read-all` to mark all notifications as read. |
| `getGroupActivity` | `client/src/services/activityService.js` | 6 | Calls GET `/groups/:groupId/activity` to fetch the group activity log. |

### Client — App Shell & Layout

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `toggleMobileMenu` | `client/src/App.vue` | 2 | Toggles the visibility state of the mobile navigation sidebar. |
| `closeMobileMenu` | `client/src/App.vue` | 2 | Forces the mobile navigation sidebar to close. |
| `fetchUnreadCount` | `client/src/components/layout/AppTopbar.vue` | 6 | Fetches the unread notification count from the API to update the topbar badge. |

### Client — View Functions

| Function | File | Phase | Responsibility |
|----------|------|-------|----------------|
| `openGroupModal` | `client/src/views/Groups.vue` | 2 | Opens the Create Group modal. |
| `closeGroupModal` | `client/src/views/Groups.vue` | 2 | Closes the Create Group modal. |
| `openExpenseModal` | `client/src/views/Expenses.vue` | 2 | Opens the Add Expense modal. |
| `closeExpenseModal` | `client/src/views/Expenses.vue` | 2 | Closes the Add Expense modal. |
| `loadInitialGroups` | `client/src/views/Balances.vue` | 5 | Fetches the user's groups on mount and selects the first one. |
| `onGroupChange` | `client/src/views/Balances.vue` | 5 | Triggers a data reload whenever the selected group changes. |
| `loadGroupFinancials` | `client/src/views/Balances.vue` | 5 | Concurrently fetches balances, suggestions, and settlement history for the active group. |
| `openRecordModal` | `client/src/views/Balances.vue` | 5 | Opens the settlement recording modal, pre-filling it from a suggestion. |
| `closeRecordModal` | `client/src/views/Balances.vue` | 5 | Closes and resets the settlement recording modal. |
| `submitSettlement` | `client/src/views/Balances.vue` | 5 | Sends the settlement form data to the backend and refreshes financial data on success. |
| `openActivityModal` | `client/src/views/Groups.vue` | 6 | Opens the group activity feed modal and fetches recent events. |
| `closeActivityModal` | `client/src/views/Groups.vue` | 6 | Closes and resets the group activity feed modal. |
| `loadGroups` | `client/src/views/Chat.vue` | 6 | Fetches user groups on Chat mount and selects the initial group. |
| `selectGroup` | `client/src/views/Chat.vue` | 6 | Switches the active group in chat and loads that group's messages. |
| `loadMessages` | `client/src/views/Chat.vue` | 6 | Fetches messages for the selected group and scrolls to the latest. |
| `refreshMessages` | `client/src/views/Chat.vue` | 6 | Manual user-triggered message refresh (no polling timer). |
| `handleSendMessage` | `client/src/views/Chat.vue` | 6 | Validates and sends a chat message, then appends it to the local list. |
| `loadNotifications` | `client/src/views/Notifications.vue` | 6 | Fetches notifications and unread count from the backend on mount. |
| `handleMarkRead` | `client/src/views/Notifications.vue` | 6 | Marks one notification as read and decrements the local unread counter. |
| `handleMarkAllRead` | `client/src/views/Notifications.vue` | 6 | Marks all notifications as read in one API call. |
