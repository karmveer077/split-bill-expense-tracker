# Database Documentation

**Database Name:** `split_bill_tracker`

### Setup and Migrations
Execute `database/schema.sql` via MySQL Workbench or the MySQL command line client.

For **Phase 6**, rerun `database/schema.sql` to create the new `messages`, `notifications`, and `activity_logs` tables.
Because the schema uses `CREATE TABLE IF NOT EXISTS`, rerunning `schema.sql` is completely safe:
* It creates the new `messages`, `notifications`, and `activity_logs` tables with proper foreign keys and indexes.
* Existing tables (`users`, `` `groups` ``, `group_members`, `expenses`, `expense_splits`, `settlements`) and all existing data remain intact.
* No data is dropped or reset.

### Integer Currency
All financial amounts are stored as unsigned integers in paise (1 INR = 100 paise) to avoid floating-point inaccuracies.

**Important Note:** Do not commit valid `.env` database passwords to version control.

