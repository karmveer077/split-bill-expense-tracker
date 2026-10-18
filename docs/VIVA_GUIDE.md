# Viva Preparation Guide — SplitBill

Short, direct answers for common viva questions. All answers reflect actual project behavior.

---

## 1. What problem does SplitBill solve?

When a group shares expenses — on a trip, at a flat, at dinner — it is hard to track who paid for what and who owes whom. SplitBill lets members record every shared expense, view their net balance, and settle debts efficiently without manual calculation.

---

## 2. Why did you choose Vue, Node.js, Express, and MySQL?

| Technology | Reason |
|-----------|--------|
| **Vue 3** | Component-based, beginner-friendly Options API; integrates cleanly with Vite and Tailwind |
| **Node.js + Express** | Lightweight, JavaScript-based server; easy to set up REST APIs with minimal boilerplate |
| **MySQL** | Relational data with foreign keys naturally models users, groups, expenses, and splits |
| **JWT** | Stateless authentication that works well with a decoupled frontend/backend |

---

## 3. What does the frontend do vs. the backend?

- **Frontend (Vue):** Renders the UI, handles forms, validates input client-side, calls backend APIs using `fetch()`, and stores the JWT in `localStorage`.
- **Backend (Express):** Validates all data again, checks authorization, runs SQL queries, hashes passwords, issues JWTs, and returns JSON responses.
- The backend is the source of truth. The frontend only displays what the backend confirms.

---

## 4. What is a REST API?

REST (Representational State Transfer) is a set of conventions for web APIs. Each endpoint represents a resource:
- `GET` — read data
- `POST` — create something new
- `PUT` — update existing data
- `DELETE` — remove data

The client sends HTTP requests to URLs like `/api/groups` and the server replies with JSON. This project has 23 REST API endpoints.

---

## 5. How does JWT authentication work here?

1. The user submits email and password to `POST /api/auth/login`.
2. The server checks the password with `bcrypt.compare()`.
3. If valid, the server signs a **JSON Web Token** containing the user's ID using `jwt.sign()` with a secret key.
4. The token is returned to the frontend and stored in `localStorage`.
5. Every subsequent API request includes the token in the `Authorization: Bearer <token>` header.
6. The `authMiddleware` on the server verifies the token with `jwt.verify()`, extracts the user ID, and attaches it to `req.user`.
7. **Logout** is handled entirely on the client — just remove the token from `localStorage`. No server call is needed because JWTs are stateless.

---

## 6. Why is bcrypt used instead of storing plain passwords?

`bcrypt` is a one-way hashing function. Even if the database is leaked, attackers cannot reverse the hash to discover the original password. bcrypt also adds a **salt** (random data) to each hash, so two users with the same password still produce different hashes — preventing rainbow table attacks.

---

## 7. Why does MySQL use foreign keys?

Foreign keys enforce referential integrity. For example:
- An expense's `group_id` must reference a real group in the `groups` table.
- An expense's `paid_by` must reference a real user.

If a referenced row is deleted, the database can automatically cascade the deletion (as with `expense_splits ON DELETE CASCADE`) or block the deletion. This prevents orphaned records and data corruption.

---

## 8. Why is money stored as integer paise instead of decimal rupees?

Floating-point numbers (like JavaScript's `Number`) cannot represent all decimal values exactly. For example:
```js
0.1 + 0.2 === 0.30000000000000004  // not 0.3!
```

In financial calculations, even tiny rounding errors accumulate. By storing amounts as **integer paise** (₹1 = 100 paise), all arithmetic uses exact integer math:
```js
// Correct: 90 paise + 10 paise = 100 paise (no drift)
// Displayed to users as ₹1.00 using paiseToRupees()
```

---

## 9. How does equal split work vs. custom split?

**Equal split:**
- Total paise is divided by the number of participants using `Math.floor`.
- Any leftover paise (the remainder from integer division) is added to the first participant's share.
- Example: ₹100 (10000 paise) among 3 people → 3333 + 3334 + 3333.

**Custom split:**
- Each participant's share is entered manually in rupees.
- The backend validates that the sum of all shares equals the total expense amount (converted to paise).
- If the total does not match, the request is rejected with a 400 error.

---

## 10. What is the balance formula?

```
Net Balance = Expense Paid − Expense Share Owed + Settlements Sent − Settlements Received
```

- **Positive** net balance → member should **receive** money (`owed`)
- **Negative** net balance → member **owes** money (`owes`)
- **Zero** → member is settled (`settled`)

The sum of all member net balances in a group is always zero. Balances are calculated dynamically from the database each time they are requested — there is no stored balances table.

---

## 11. How does the greedy settlement algorithm work?

Implemented in `server/src/utils/settlementAlgorithm.js`:

1. Separate all members into **creditors** (positive net balance) and **debtors** (negative net balance).
2. Sort both lists in **descending order** of absolute amount.
3. Take the largest debtor and largest creditor.
4. The suggested payment is the **smaller** of the two amounts.
5. Subtract that amount from both. If either reaches zero, move to the next person.
6. Repeat until all debts and credits are cleared.

Example: If A is owed ₹600 and B owes ₹400 and C owes ₹200 → suggest: B pays A ₹400, C pays A ₹200. Done in 2 payments.

---

## 12. Why is it called "practical greedy" rather than "globally optimal"?

The algorithm is **greedy** because it always picks the largest value first without looking ahead. This works well for typical group expense scenarios and reduces the number of payments significantly.

However, it is **not guaranteed** to always find the minimum possible number of transactions. In some arrangements, a different algorithm (like solving it as an optimization problem) might produce fewer payments. Claiming it is globally optimal would be inaccurate. The documentation and UI describe it honestly as a practical approach.

---

## 13. How does authorization protect group data?

Two layers:

1. **Authentication** — `authMiddleware` verifies the JWT on every protected route. If the token is missing or invalid, the request is rejected with 401.
2. **Authorization** — Controllers check membership. For example, `checkMembership(groupId, userId)` queries `group_members` to confirm the caller belongs to the group. If not, the server returns 403. Group edits additionally check that the caller is the group creator.

This means a logged-in user cannot access another group's expenses, balances, chat, or settlements.

---

## 14. Why is chat REST-based instead of real-time WebSocket-based?

For a college-level project, WebSockets add significant complexity:
- Maintaining persistent connections on the server
- Handling reconnection logic on the client
- Scaling challenges if multiple server instances are needed

The REST approach is simpler: messages are saved to MySQL via `POST /api/groups/:id/messages` and fetched via `GET`. Users see new messages when they navigate to the chat page or click the **Refresh Messages** button. This is a conscious, documented trade-off, not a limitation that was overlooked.

---

## 15. What limitations would you improve in a larger production project?

| Limitation | Improvement |
|-----------|-------------|
| No real-time updates | Use WebSockets (Socket.IO) for live chat and notification push |
| JWT not revocable | Maintain a token blacklist or use short-lived access + refresh token pairs |
| `rejectUnauthorized: false` in SSL | Use the actual CA certificate from Aiven for full TLS verification |
| No file uploads | Add receipt image uploads (e.g. via AWS S3) |
| Single currency (INR) | Add multi-currency support with stored exchange rates |
| No email notifications | Integrate a transactional email service (e.g. SendGrid) |
| No settlement editing | Allow corrections to incorrectly recorded settlements |
| Render free-tier sleep | Use a paid tier or implement a ping service to keep the server warm |
