# SplitBill

SplitBill is a full-stack application for managing shared group expenses. Create groups, add expenses, split costs, track balances, and record payments in one place.

## Features

- Secure account registration and sign-in
- Group creation and invite codes
- Equal and custom expense splits
- Expense search, editing, and deletion
- Balance summaries and payment suggestions
- Settlement history
- Group chat, notifications, and activity updates

## Built With

- Vue 3 and Tailwind CSS
- Node.js and Express
- MySQL

## Run Locally

1. Create the database by running `database/schema.sql` in MySQL Workbench.

2. In `server/`, copy `.env.example` to `.env`, add your local MySQL credentials, then run:

   ```powershell
   npm.cmd install
   npm.cmd run dev
3. In a second terminal, open client/, copy .env.example to .env, then run:
   npm.cmd install
   npm.cmd run dev
Open the URL shown in the client terminal, normally http://localhost:5173.
Environment Variables
Use the included .env.example files as templates. Never commit real .env files or database passwords.
