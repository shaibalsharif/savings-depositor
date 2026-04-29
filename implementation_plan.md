# Two-Way Synchronization: Neon DB ↔ Google Sheets

The goal is to create a robust, free, and optimized two-way synchronization pipeline between the Next.js application (Neon DB) and Google Sheets. Changes made by the manager in the app should reflect in the sheet, and manual edits in the sheet should flow back into the app.

## Proposed Architecture

To keep this free and highly optimized, we will use a hybrid approach combining synchronous app writes and Google Apps Script webhooks for sheet writes.

### 1. App → Sheet (Push)
When a manager records a transaction (Deposit, Expense, etc.) in the app:
1. **Database First:** The transaction is saved in Neon DB.
2. **Optimized Sync:** We will use a background queue or immediate API call (which we already partially have in `lib/sheets.ts`) to update the Google Sheet. 
3. **Failsafe:** If the Sheet API fails (e.g., rate limit), the DB record is flagged with `sync_status: "pending"`. A regular cron job will retry pending syncs later.

### 2. Sheet → App (Webhook Pull)
When a user manually edits the Google Doc/Sheet:
1. **Google Apps Script:** We will add a small, free script to your Google Sheet using the `onEdit` trigger.
2. **Webhook:** Whenever a row is added or modified in the sheet, the script instantly sends an HTTP POST request to a secure API endpoint in our Next.js app (e.g., `/api/webhooks/sheet-sync`).
3. **Database Update:** The Next.js app receives the data, validates it (ensuring numbers are numbers, dates are valid), and updates Neon DB.

### 3. Failsafe & Error Visibility (Admin UI)
We will create a new database table `sync_logs` and an **Admin Sync Dashboard**:
- **Error Tracking:** If someone types "five" instead of "5" in the sheet, the webhook will catch the validation error and log it in the `sync_logs` table instead of crashing.
- **Admin Visibility:** A dedicated page in the app will show you "Sync Errors" (e.g., "Sheet update failed on row 12: Invalid Date").
- **Manual Override:** A "Force Sync" button to manually pull the latest sheet data and resolve mismatches.

---

## Technical Implementation Steps

1. **Database Schema Updates:**
   - Add a `sync_logs` table to track webhook events, successes, and errors.
   - Ensure all main tables (payments, expenses, etc.) have a `sync_status` (synced, pending, failed) and `sheets_row_index` column.

2. **Next.js Webhook API:**
   - Create `/api/webhooks/sheets` to receive payloads from Google Sheets.
   - Implement Zod validation to ensure incoming sheet data is safe before touching Neon DB.

3. **Google Apps Script Creation:**
   - Provide you with a block of JavaScript code to paste into your Google Sheet's "Apps Script" editor.
   - Set up the script to securely authenticate with your Next.js app via an API key.

4. **Admin UI:**
   - Build a `/settings/sync` dashboard page to display the `sync_logs` and provide a manual "Run Sync" button.

---

## Identified Risks & Mitigation

> [!WARNING]
> **API Rate Limits:** Google Sheets API has a limit of 60 requests per minute per user.
> *Mitigation:* We will batch updates where possible and use a retry mechanism for failed app-to-sheet writes.

> [!CAUTION]
> **Data Integrity:** Spreadsheets are free-form. A user can accidentally delete a row or enter text in a number column, causing database syncs to fail.
> *Mitigation:* The Next.js webhook will strictly validate data. If it fails, the DB is NOT corrupted. Instead, an error is logged to the Admin Sync Dashboard telling the manager exactly which row caused the issue.

> [!IMPORTANT]
> **Race Conditions:** If a manager edits a record in the app at the exact same millisecond someone edits it in the sheet, data could overwrite.
> *Mitigation:* We will rely on a "Last Write Wins" logic using `updated_at` timestamps to determine the most recent source of truth.

## Spreadsheet Reorganization Plan
I have analyzed the provided Excel file (`Project 13 Payment, Investment , Expense & Balance (1).xlsx`). Currently, the spreadsheet is structured for **human readability** (e.g., matrix layouts where rows are members and columns are months, split across different sheets by year, and side-by-side tables for investments/expenses). 

**Why this needs to change:**
Two-way sync relies on a "Row-based Ledger" format (similar to a database table). Webhooks and syncing scripts cannot easily map matrix layouts or side-by-side tables to database tables because a single cell edit in a matrix doesn't provide enough context (like the exact payment date or transaction ID).

**Proposed Changes to the Spreadsheet:**
To make two-way sync seamless, reliable, and completely automated, we must switch to a **Ledger Model**. We will create dedicated, flat sheets for data entry/syncing, and keep your matrix views as automated "Dashboard" sheets.

1. **New "Raw Data" Sheets (For 2-Way Sync):**
   * **`App_Deposits`**: Columns: `Payment ID`, `Date`, `Member Name`, `Amount Received`, `Months Allocated (e.g., Jan'26)`, `Note`, `Sync Status`.
   * **`App_Expenses`**: Columns: `Expense ID`, `Date`, `Category`, `Description`, `Amount`, `Sync Status`.
   * **`App_Investments`**: Columns: `Investment ID`, `Date`, `Recipient`, `Principal`, `Expected Return`, `Sync Status`.
   * **`App_Revenue`**: Columns: `Entry ID`, `Date`, `Type (Income/Loss)`, `Description`, `Amount`, `Sync Status`.
   
   *Whenever the manager records a deposit in the web app, a row is added here. If someone manually adds a row here, the Apps Script instantly pushes it to the web app.*

2. **Automated "Dashboard" Sheets (For Human Viewing):**
   * We will recreate your `Payment till Dec25` and `Payment from January26` sheets using Google Sheets formulas (like `QUERY()` or Pivot Tables). 
   * These sheets will automatically pull data from `App_Deposits` and format it exactly how you have it now (Members on the left, Months across the top). 
   * **Crucial Rule:** Users will *not* edit the matrix view directly. All edits/additions must happen in the `App_Deposits` sheet (or through the web app).

---

## User Review Required

1. **Does this architecture (Apps Script Webhook + Failsafe Logging) align with your expectations for a free, real-time sync?**
2. **Are you okay with adopting the "Raw Data (Ledger) + Automated Dashboard" approach in your Google Sheet?** (This means you will enter new records in a flat list row-by-row, and the matrix updates automatically).
3. **Do you already have a Google Service Account configured with your `.env.local` for the App -> Sheet direction?**
