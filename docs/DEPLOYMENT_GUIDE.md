# Deployment Guide — SplitBill

This guide explains how to manually deploy SplitBill using:

- **GitHub** — source code host
- **Aiven** — hosted MySQL database
- **Render** — Express backend host
- **Vercel** — Vue frontend host

> **Security rule:** Never commit `.env` files or credentials to Git.  
> **Account note:** Your GitHub, Vercel, and Render accounts may use different email addresses. GitHub connects to both Vercel and Render so they can pull your code. Aiven does not need access to your GitHub repository — it only provides database connection details you paste manually.

---

## Step 1 — Push Code to GitHub

1. Create a **private or public** GitHub repository (e.g. `split-bill-expense-tracker`).
2. In your project folder, open a terminal (PowerShell):

```powershell
git init
git add .
git commit -m "Initial commit — Phase 7 complete"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/split-bill-expense-tracker.git
git push -u origin main
```

The root `.gitignore` already excludes `node_modules/`, `dist/`, and all `.env` files with secrets.  
`.env.example` files **are** committed — they are safe templates with no real values.

---

## Step 2 — Create an Aiven MySQL Database

1. Sign up at [aiven.io](https://aiven.io) and create a new **MySQL** service on the free tier.
2. Once the service is running, go to its **Connection information** panel.
3. Copy these values exactly — you will paste them into Render in Step 3:
   - `Host`
   - `Port` *(copy the exact port shown — do not assume 3306)*
   - `User`
   - `Password`
   - `Database name` *(note which database is selected — you will use this as `DB_NAME`)*
4. For this project we set `DB_SSL=true` with `rejectUnauthorized: false`, which enables TLS without verifying the certificate chain. This is acceptable for a college project.
5. Run the schema against your Aiven database to create all 8 tables. **Use the same database that you noted as `DB_NAME` above.** Choose one of the following methods:

   **Option A — MySQL Workbench:**
   - Connect to your Aiven database using the host, port, user, and password from the Connection information panel.
   - Open `database/schema.sql` as an SQL script (File → Open SQL Script).
   - Make sure the correct database is selected in the schema dropdown.
   - Click the lightning-bolt **Execute** button to run the entire script.

   **Option B — Aiven web SQL editor:**
   - Open the Aiven console and navigate to your MySQL service → **Query** tab.
   - Select the target database from the database selector.
   - Open `database/schema.sql` in a text editor, copy all the SQL statements, and paste them into the query box.
   - Click **Run** to execute.

   > **Important:** `database/schema.sql` starts with `CREATE DATABASE IF NOT EXISTS split_bill_tracker; USE split_bill_tracker;`. If Aiven pre-creates a database with a different name (e.g. `defaultdb`), you can either use the Aiven console to create a database named `split_bill_tracker`, or remove those two lines from the script and run it while the correct database is already selected. Set `DB_NAME` in Render to match whichever database name you actually use.

---

## Step 3 — Deploy the Backend on Render

1. Sign up at [render.com](https://render.com) and click **New → Web Service**.
2. Connect your GitHub account and select the `split-bill-expense-tracker` repository.
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Environment** | Node |
| **Plan** | Free |

4. Add these **Environment Variables** in the Render dashboard:

```
DB_HOST=         (copy exact host from Aiven Connection information)
DB_PORT=         (copy exact port from Aiven Connection information)
DB_USER=         (copy exact user from Aiven Connection information)
DB_PASSWORD=     (copy exact password from Aiven Connection information)
DB_NAME=split_bill_tracker
DB_SSL=true
JWT_SECRET=a_long_random_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-app.vercel.app
```

> **Note:** Do not add `PORT` manually in Render. Render supplies the `PORT` environment variable automatically; the `5000` fallback in `server.js` is only used for local development.

> **About `DB_SSL=true`:** When this is set, the backend enables TLS when connecting to the database using `ssl: { rejectUnauthorized: false }`. This disables certificate chain verification — acceptable for a college project, but in a production system you would provide the CA certificate instead.

> **About `CLIENT_URL`:** You will get the Vercel URL in Step 5. You can set a placeholder now (e.g. `http://placeholder.example.com`) and update it after Vercel deployment.

5. Click **Create Web Service**. Render will install dependencies and start the server.
6. Once deployed, copy your **Render backend URL** (e.g. `https://split-bill-server.onrender.com`).

---

## Step 4 — Deploy the Frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Framework Preset** | Vite |

4. Add this **Environment Variable** in the Vercel dashboard:

```
VITE_API_BASE_URL=https://split-bill-server.onrender.com/api
```

> **Important:** The value **must include `/api`** at the end. The frontend's `apiClient.js` appends only the endpoint path (e.g. `/auth/login`), not the `/api` prefix.

5. Click **Deploy**. Vercel builds `client/` and publishes to a URL (e.g. `https://split-bill.vercel.app`).
6. Copy your **Vercel frontend URL**.

---

## Step 5 — Cross-Link the Two Services

1. In the **Render** dashboard, update the `CLIENT_URL` environment variable to your Vercel URL:
   ```
   CLIENT_URL=https://split-bill.vercel.app
   ```
2. Trigger a **manual redeploy** in Render (or wait — Render may redeploy automatically on env changes).
3. In **Vercel**, confirm `VITE_API_BASE_URL` points to the correct Render URL. If you changed it, trigger a redeploy in Vercel.

---

## Step 6 — Test the Live Deployment

Open your Vercel URL and test the following:

- [ ] Register a new account
- [ ] Log in
- [ ] Create a group
- [ ] Add an expense (equal split)
- [ ] Add an expense (custom split)
- [ ] View group balances
- [ ] View settlement suggestions
- [ ] Record a settlement
- [ ] Send a chat message
- [ ] View notifications
- [ ] Mark notifications as read
- [ ] Log out

If any step fails, check the **Render logs** (Dashboard → your service → Logs tab) for server-side errors.

---

## Free-Tier Limitations

| Service | Limitation |
|---------|-----------|
| **Render** (free) | The free service sleeps after inactivity. The first request after it sleeps may take longer while it starts back up. |
| **Aiven** (free) | MySQL storage and connection limits apply. The free tier is sufficient for a college project. |
| **Vercel** (free) | No significant limitations for a static frontend with environment variables. |

---

## Environment Variable Reference

### `server/.env` (real file — never commit)

```
PORT=5000
DB_HOST=             # Exact host from Aiven Connection information
DB_PORT=             # Exact port from Aiven Connection information
DB_USER=             # Exact user from Aiven Connection information
DB_PASSWORD=         # Exact password from Aiven Connection information
DB_NAME=split_bill_tracker
DB_SSL=false         # Set to true when connecting to Aiven on Render
JWT_SECRET=          # Long random string (min 32 chars)
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

*For local development, `PORT=5000` and `DB_SSL=false` are the correct defaults.*

### `client/.env` (real file — never commit)

```
VITE_API_BASE_URL=   # Your Render URL ending in /api
```
