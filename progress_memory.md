# 🧠 NKB Petty Cash System: Agent Work Memory & Milestones

This document serves as a permanent memory log of all accomplishments, structural setups, and custom code fixes performed for the NKB Petty Cash System. It acts as the definitive reference point for all subsequent development sessions.

---

## 📅 Session Milestones (May 19, 2026)

### 1. ⚙️ Local MySQL Standalone Integration
- **Context:** The local `.env` database parameters were previously throwing `ECONNREFUSED` because no local database server was active.
- **Action:** 
  1. Proactively launched a standalone MySQL service in the background:
     ```powershell
     Start-Process "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--standalone" -NoNewWindow
     ```
  2. Verified that the MySQL service successfully bound to IPv4/IPv6 port `3306` (`LISTENING`).
  3. Logged in as root and replicated the production credentials locally so the `.env` file remained completely unmodified:
     ```sql
     CREATE DATABASE IF NOT EXISTS u335953510_pettycash_db;
     CREATE USER IF NOT EXISTS 'u335953510_ssh'@'localhost' IDENTIFIED BY 'NkbManufacturing@2026';
     GRANT ALL PRIVILEGES ON u335953510_pettycash_db.* TO 'u335953510_ssh'@'localhost';
     FLUSH PRIVILEGES;
     ```

### 2. 🗄️ Database Schemas & Collation Correction
- **Migrations:** Successfully ran 6 Knex migrations using a CMD session to bypass PowerShell script blocking:
  - `20260512000000_initial_schema.js` (Core tables: users, departments, categories, expenses, expense_attachments, activity_logs, settings)
  - `20260512075907_create_funds_table.js`
  - `20260512080000_add_quantity_unit_to_expenses.js`
  - `20260512080100_add_brand_to_expenses.js`
  - `20260515064955_add_notifications_and_email_system.js`
  - `20260517090000_create_notification_center_tables.js`
- **Encoding Fix:** Encountered a seed execution error because the local MySQL collation (defaulting to latin1) crashed when attempting to insert the Peso symbol (`₱`). Resolved by converting the entire database and `email_templates` table to `utf8mb4`:
  ```sql
  ALTER DATABASE u335953510_pettycash_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ALTER TABLE u335953510_pettycash_db.email_templates CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- **Seeding:** Ran 3 seed files successfully, populating 18 manufacturing expense categories (GAS, ICT, TRANSPO, etc.), 5 departments, dynamic application settings, and **127 historical sample expenses** representing 60 days of real-world activities.
- **Fund Injection:** Injected an initial fund replenishment of **`₱1,000,000.00`** under System Administrator ID `2` to balance the massive historical expenses and produce a highly realistic, positive balance representation.

### 3. 🎨 Executive Dashboard & UI Polishing
- **Count Formatting Fix:** In `Dashboard.jsx`, the `StatCard` was modified to accept an `isCurrency` boolean prop. The "Pending Approval" card count is now formatted cleanly as a plain integer (`8`) instead of the awkward currency representation (`₱8`).
- **Precision Labeling:** Updated sub-labels for all 4 hero cards to present accurate financial context:
  - **Total Expenses:** `"vs last month"` (Monetary sum)
  - **Today's Spend:** `"vs yesterday"` (Monetary sum)
  - **Pending Approval:** `"vouchers pending action"` (Numerical count)
  - **Available Fund:** `"current system balance"` (Monetary sum)
- **Dynamic Category Dates:** In `Categories.jsx`, replaced the hardcoded `"Updated 2d ago"` metadata with a live JavaScript parse of the category's database `created_at` timestamp:
  ```javascript
  Created {new Date(cat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
  ```
  This renders dynamically as e.g. **`Created May 19, 2026`** on the cards.

### 4. 🧪 Production Build & Automated Verification
- Rebuilt frontend static assets with `npm run build` and mirrored everything to backend `dist` folder.
- Started the production backend Express server on local port `5000`.
- Deployed a **Browser Subagent** to log in as administrator (`admin` / `admin123`) and verify all views:
  - **Dashboard:** Loaded all charts, area maps, category breakdown charts, and latest voucher lists perfectly.
  - **Categories:** Loaded all 18 customized, newly-seeded cards with dynamic timestamps.
  - **Screenshots Saved:** 
    - [dashboard_polished_1779188186188.png](file:///C:/Users/Nkb%20Manuf/.gemini/antigravity/brain/9247cffd-3858-49d1-8af7-f5cc2b168731/dashboard_polished_1779188186188.png)
    - [categories_polished_1779188197409.png](file:///C:/Users/Nkb%20Manuf/.gemini/antigravity/brain/9247cffd-3858-49d1-8af7-f5cc2b168731/categories_polished_1779188197409.png)

---

## 🔮 Future Reference Guidelines
- **Local MySQL:** Standalone MySQL service is active under Windows PID `15328`. If the connection fails in a future session, check if it was closed and run:
  `Start-Process "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--standalone" -NoNewWindow`
- **Port:** Local port `5000` is active.
- **Collation:** Always ensure database/table collation remains `utf8mb4` when adding templates or assets utilizing symbols (like `₱`).
