# Project Structure

The permanent project structure for the Split-Bill & Group Expense Tracker application is organized as follows:

```
split-bill-expense-tracker/
│
├── client/                     # Frontend Vue 3 application
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── assets/             # Reusable visual assets
│   │   ├── components/
│   │   │   ├── common/         # Reusable visual components
│   │   │   │   ├── AppLogo.vue
│   │   │   │   ├── AppModal.vue
│   │   │   │   ├── BaseButton.vue
│   │   │   │   ├── EmptyState.vue
│   │   │   │   ├── ErrorState.vue
│   │   │   │   ├── FormField.vue
│   │   │   │   ├── LoadingState.vue
│   │   │   │   ├── PageHeader.vue
│   │   │   │   ├── SectionCard.vue
│   │   │   │   └── SummaryCard.vue
│   │   │   └── layout/         # Application shell components (sidebar, topbar with notification badge)
│   │   ├── utils/              # Helper and computation functions (expenseHelpers.js)
│   │   ├── router/             # Vue Router configuration
│   │   ├── services/           # API Fetch Services (auth, group, expense, balance, settlement, message, notification, activity)
│   │   ├── views/              # Page components (Dashboard, Groups, Expenses, Balances, Chat, Notifications, etc.)
│   │   ├── App.vue             # Root component handling layout
│   │   ├── main.js             # Vue initialization and plugin registration
│   │   └── index.css           # Tailwind directives and global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend folder
│   ├── .env.example            # Environment variables placeholder
│   ├── package.json            # Node dependencies
│   ├── README.md               # Backend execution basics
│   ├── test-phase5.js          # Standalone verification tests (node:assert/strict)
│   └── src/
│       ├── config/             # DB Pool configuration
│       ├── controllers/        # Request handlers (auth, group, expense, balance, settlement, message, notification, activity)
│       ├── middleware/         # Auth & error pipelines
│       ├── routes/             # Express routes (auth, group, expense, settlement, message, notification)
│       ├── utils/              # Calculation & helper logic (balanceCalculator, settlementAlgorithm, money, inviteCode, validators, groupEvents)
│       ├── app.js              # Express app setup and middleware registration
│       └── server.js           # Server listener
│
├── database/                   # Database folder
│   ├── schema.sql              # MySQL DDL (users, `groups`, group_members, expenses, expense_splits, settlements, messages, notifications, activity_logs)
│   └── README.md               # Database setup and rerun instructions
│
├── docs/                       # Project documentation
│   ├── PROJECT_STRUCTURE.md
│   ├── API_AND_FUNCTIONS.md
│   ├── PHASE_PROGRESS.md
│   ├── DEPLOYMENT_GUIDE.md     # Manual deployment guide (GitHub → Aiven → Render → Vercel)
│   └── VIVA_GUIDE.md           # Viva preparation Q&A
│
├── .gitignore
└── README.md
```

## Guiding Principles
- Project logic remains in simple JavaScript modules and functions (no TypeScript).
- No complex abstractions or state management libraries (e.g., Pinia, Vuex) are used.
- The UI focuses on clean, beginner-friendly Vue Options API and simple Tailwind utility styling.
- All messaging, notification tracking, and activity logging use standard Express REST APIs and MySQL persistence; no WebSockets, Socket.IO, polling timers, or external real-time servers are used.

