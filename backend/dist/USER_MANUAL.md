# NKB Petty Cash Management System — User Manual

**Version:** 1.0  
**Last Updated:** June 2026  
**Organization:** NKB Manufacturing

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Logging In](#4-logging-in)
5. [Dashboard](#5-dashboard)
6. [Expense Monitoring](#6-expense-monitoring)
7. [Fund Management](#7-fund-management)
8. [Analytics](#8-analytics)
9. [Reports](#9-reports)
10. [Categories](#10-categories)
11. [Cost Centers (Departments)](#11-cost-centers-departments)
12. [User Management](#12-user-management)
13. [Notification Center](#13-notification-center)
14. [Audit Logs](#14-audit-logs)
15. [System Maintenance (Backup & Restore)](#15-system-maintenance-backup--restore)
16. [Queue Monitor](#16-queue-monitor)
17. [Settings](#17-settings)
18. [Profile & Password](#18-profile--password)
19. [Approval Action (Email-Based)](#19-approval-action-email-based)
20. [Glossary](#20-glossary)

---

## 1. Introduction

The **NKB Petty Cash Management System** is an enterprise-grade web application designed for NKB Manufacturing to monitor, control, and audit petty cash expenditures in real time. It provides role-based access control, financial analytics, automated email approval workflows, and comprehensive audit logging — all in a single unified dashboard.

### Key Features

- Real-time expense tracking and voucher management
- Petty cash fund replenishment and balance monitoring
- Multi-dimensional financial analytics with interactive charts
- Excel and PDF export for reports
- Email-based approval workflow for high-value liquidations
- In-app notification system with broadcast, scheduling, and templates
- Full audit trail with user action tracking
- Database backup and disaster recovery
- Role-based access control (Super Admin, Accounting, Manager, Staff)

---

## 2. System Requirements

| Requirement | Specification |
|---|---|
| **Browser** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **Internet** | Required (cloud-hosted) |
| **Screen** | Minimum 1280×720 (optimized for 1366×768+) |
| **Mobile** | Responsive (partial support for tablet/phone) |

---

## 3. User Roles & Permissions

The system enforces **Role-Based Access Control (RBAC)** with four distinct tiers:

| Feature / Page | Super Admin | Accounting | Manager | Staff |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Expenses (View/Add) | ✅ | ✅ | ✅ | ✅ |
| Expenses (Approve/Reject) | ✅ | ✅ | ✅ | ❌ |
| Expenses (Liquidate) | ✅ | ✅ | ❌ | ❌ |
| Expenses (Delete) | ✅ | ❌ | ❌ | ❌ |
| Funds | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ |
| Categories | ✅ | ✅ | ✅ | ✅ |
| Cost Centers | ✅ | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Notification Center (Admin) | ✅ | ✅ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Maintenance | ✅ | ❌ | ❌ | ❌ |
| Queue Monitor | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ | ✅ |

---

## 4. Logging In

### How to Access

1. Open your browser and navigate to the NKB Petty Cash URL.
2. You will be presented with the **Enterprise Access** login screen.

### Login Fields

| Field | Description |
|---|---|
| **Authorized ID** | Your assigned employee username (e.g., `jsantos`) |
| **Security Credential** | Your confidential password |

### Buttons & Controls

| Button / Control | Function |
|---|---|
| **Eye / Eye-Off icon** (inside password field) | Toggles password visibility on/off |
| **Authenticate Access** | Submits your credentials and logs you into the system. Shows a spinner while processing. If credentials are invalid, a red error banner appears. |

### Login Failure

- If your credentials are incorrect, a red alert banner displays: *"Access Denied. Please verify your corporate credentials."*
- Contact your Super Admin for account provisioning or password resets.

---

## 5. Dashboard

The **Executive Dashboard** is the landing page after login. It provides a high-level financial overview of the petty cash system.

### Stat Cards (Top Row)

| Card | Description |
|---|---|
| **Total Expenses** | Aggregate sum of all recorded expenses (₱). Shows a percentage trend vs. last month. |
| **Today's Spend** | Total amount of expenses recorded for the current day. |
| **Pending Approval** | Count of expense vouchers currently in "Pending" status awaiting action. |
| **Available Fund** | Current system petty cash balance (Total Inflow minus Total Expenditures). |

### Charts

| Chart | Description |
|---|---|
| **Expenses Trend** (Area Chart) | Displays daily expenditure totals over time. Hover over data points for exact amounts. |
| **Category Allocation** (Donut Chart) | Shows distribution of expenses across categories. The center displays the total amount. |

### Chart Actions

| Button | Function |
|---|---|
| **Download icon** (on each chart) | Exports the chart as a high-resolution PNG image file. |

### Latest Voucher Feed (Table)

Displays the most recent expense entries with the following columns:

| Column | Description |
|---|---|
| **Requester** | Name and department of the person who filed the expense |
| **Category** | Expense classification |
| **Date** | Date the voucher was filed |
| **Amount** | Voucher amount in ₱ |
| **Status** | Current status: Pending (amber), Approved (green), Rejected (red) |

### Quick Actions Panel

| Button | Function |
|---|---|
| **New Expense** | Navigates to the Expenses page to create a new voucher |
| **Audit Reports** | Navigates to the Reports page |
| **Manage Personnel** | Navigates to the Users page (Super Admin only) |

### Department Expenditure

Displays a progress bar for each department showing their proportion of total expenses.

### Top Header Button

| Button | Function |
|---|---|
| **Generate Reports** | Navigates to the Reports page |

---

## 6. Expense Monitoring

The **Expense Monitoring** page is the core operational area for managing petty cash vouchers (PCVs).

### Page Header Buttons

| Button | Function |
|---|---|
| **Export Excel** (spreadsheet icon) | Downloads all expenses as an `.xlsx` file |
| **Export PDF** (PDF icon) | Generates a PDF report of the currently displayed expenses |
| **New Expense** | Opens the "New Expenditure Request" modal form |

### Filter Panel

| Control | Function |
|---|---|
| **Search PCV, remarks...** | Text search that filters expenses by PCV reference number or remarks (with 400ms debounce) |
| **All Categories** (dropdown) | Filters the list by a specific expense category |
| **Status** (dropdown) | Filters by status: Pending, Approved, Rejected, Liquidated, For Approval, Declined |
| **Date Range** (Start / End) | Filters expenses within a specific date range |
| **Reset Filters** (clock icon) | Clears all active filters and returns to the default view |

### Expense Table Columns

| Column | Description |
|---|---|
| **Date** | Voucher date, plus reference number (e.g., PCV-0001) |
| **Requester Details** | Name and department of the requester |
| **Category & Items** | Category badge and remarks text |
| **Qty / Unit** | Quantity purchased and unit of measure (e.g., 5 Box) |
| **Amount** | Total voucher amount in ₱ |
| **Status** | Current status badge |
| **Actions** | Action buttons (varies by role and status) |

### Action Buttons (per row)

| Button | Visibility | Function |
|---|---|---|
| **Approve** (checkmark, green) | Super Admin / Manager / Accounting, when status is Pending | Changes expense status to "Approved" |
| **Reject** (X icon, red) | Super Admin / Manager / Accounting, when status is Pending | Changes expense status to "Rejected" |
| **Liquidate** (history icon, blue) | Super Admin / Accounting, when status is Approved | Changes expense status to "Liquidated". If amount exceeds approval threshold, triggers email approval workflow instead. |
| **View** (eye icon) | All users | Opens the Voucher Details modal showing full info, attachments, and audit trail |
| **Edit** (pencil icon) | All users | Opens the Edit Expense Record modal to modify voucher details |
| **Delete** (trash icon, red) | Super Admin only | Permanently deletes the expense with a confirmation prompt |

### New Expenditure Request Modal

| Field | Description | Required |
|---|---|---|
| **Voucher Date** | Date of the expense | Yes |
| **Expense Category** | Select from existing categories | Yes |
| **Requester Full Name** | Full name of the person who incurred the expense | Yes |
| **Cost Center (Dept)** | Department to charge | Yes |
| **Quantity** | Number of items | Yes (default: 1) |
| **Unit of Measure** | Select from list (Box, Ream, Piece, etc.) or add a new one | Yes |
| **Add Unit** (text field + button) | Type a new unit name and press "Add Unit" or Enter to add it to the list | Optional |
| **Total Amount (PHP)** | Expense amount in Philippine Peso | Yes |
| **Status** | Choose "Pending Verification" or "Direct Approval" | Yes (default: Pending) |
| **Detailed Remarks** | Description or justification of the expense | No |
| **Discard Change** | Closes the modal without saving | — |
| **Commit Voucher** | Submits the expense to the database | — |

> **Note:** If the amount exceeds the configured approval threshold, the system automatically sets the status to "For Approval" and sends an email to the designated approver.

### View Voucher Details Modal

| Section | Description |
|---|---|
| **Requester** | Name of the requester |
| **Amount** | Voucher amount |
| **Remarks / Justification** | Detailed description |
| **Attachments** | Downloadable file links (if any were uploaded) |
| **Approval Audit Trail** | Chronological log of approval actions, including actor name, timestamp, IP address, and decline reasons |
| **Close Preview** | Closes the modal |

### Edit Expense Record Modal

| Field | Editable |
|---|---|
| Voucher Date | Yes |
| Category | Yes |
| Requester | Yes |
| Amount | Yes |
| Remarks | Yes |

| Button | Function |
|---|---|
| **Cancel** | Discards changes and closes the modal |
| **Save Changes** | Submits the edited data |

### Pagination

| Control | Function |
|---|---|
| **Previous** (left arrow) | Goes to the previous page |
| **Page Numbers** | Jumps to a specific page |
| **Next** (right arrow) | Goes to the next page |
| Record counter | Shows "Showing X - Y of Z Expense Records" |

---

## 7. Fund Management

> **Access:** Super Admin only

The **Fund Management** page tracks petty cash replenishments and overall fund liquidity.

### Balance Overview Cards

| Card | Description |
|---|---|
| **Available Liquidity** (green gradient) | Current available petty cash balance = Total Inflow - Total Expenditures. Verified by the system. |
| **Total Cash Inflow** | Sum of all fund replenishments |
| **Total Expenditures** | Sum of all approved and liquidated expenses |

### Replenishment History Table

| Column | Description |
|---|---|
| **Date** | Date the replenishment was recorded |
| **Reference No.** | Check number or OR number for tracking |
| **Remarks** | Description of the replenishment |
| **Amount** | Amount added to the fund (in green) |
| **Added By** | Name of the user who recorded the replenishment |
| **Delete** (trash icon) | Deletes the fund entry (with confirmation). Reduces total cash inflow. |

### Replenish Fund Modal

| Field | Description | Required |
|---|---|---|
| **Amount to Add (PHP)** | Replenishment amount | Yes |
| **Reference No.** | Check # or OR # for audit trail | No |
| **Voucher Date** | Date of the replenishment | Yes |
| **Discard** | Closes modal without saving | — |
| **Confirm Deposit** | Records the fund replenishment | — |

### Page Header Button

| Button | Function |
|---|---|
| **Replenish Fund** | Opens the Replenish Fund modal |

---

## 8. Analytics

The **Financial Intelligence** page provides multi-dimensional analysis of petty cash expenditures.

### View Mode Toggle

| Button | Function |
|---|---|
| **Active Analysis** | Shows current/active period data |
| **Historical Archive** | Shows historical data for trend comparison |

### Charts

| Chart | Description |
|---|---|
| **Daily Expenditure Breakdown** (Stacked Bar) | Shows daily spending broken down by category. Each color represents a different expense category stacked on top of each other. |
| **Category Intensity** (Bar Chart) | Shows spending for a selected category over time. Use the dropdown to focus on a specific category or view all. |
| **Allocation Matrix** (Donut Chart) | Shows the relative spending distribution across departments. |

### Chart Actions

| Button | Function |
|---|---|
| **Export Graph** (on Date Range chart) | Downloads the stacked bar chart as a PNG image |
| **Download icon** (on Category chart) | Downloads the category bar chart as a PNG image |
| **Category Dropdown** | Filters the Category Intensity chart to a specific category |

### Summary Cards (Bottom)

| Card | Description |
|---|---|
| **Avg Daily Burn** | Average daily expenditure amount |
| **Top Category** | The category with the highest total spending |
| **Active Depts** | Number of departments with recorded expenses |
| **Vouchers Issue** | Count of recent vouchers |

---

## 9. Reports

The **Audit & Reporting** page generates enterprise-grade financial statements.

### Export Buttons

| Button | Function |
|---|---|
| **Export Visual PDF** | Captures the current report view as a PDF using html2canvas and jsPDF |
| **Generate Excel Ledger** | Downloads a detailed `.xlsx` report with all expense data for the selected period |

### Reporting Parameters (Filter Panel)

| Field | Description |
|---|---|
| **Start Period** | Beginning date for the report range |
| **End Period** | Ending date for the report range |
| **Focus Category** | Filter report to a specific category (or "All Categories") |
| **Department Scope** | Filter report to a specific department (or "Entire Enterprise") |

> Filters update the report charts and summary automatically in real time.

### Summary Matrix Cards

| Card | Description |
|---|---|
| **Aggregate Spend** (blue left border) | Total approved expenditure for the selected period |
| **Transaction Volume** (indigo left border) | Total count of vouchers within the selected period |
| **Quick Audit Insights** | Top 3 categories by spending with a "Full Forensic Breakdown" link that exports to Excel |

### Visual Analytics

| Chart | Description |
|---|---|
| **Category Distribution** (Bar Chart) | Bar chart showing total spending per category |
| **Department Allocation** (Donut Chart) | Donut chart showing spending proportion per department |

### Info Banner

| Button | Function |
|---|---|
| **View Analytics Detail** | Navigates to the Analytics page for deeper analysis |

---

## 10. Categories

The **Financial Classifications** page manages expense categories used across the system.

### Page Header Button

| Button | Function |
|---|---|
| **New Category** | Opens the "New Classification" modal |

### Category Cards

Each category is displayed as a card with:

| Element | Description |
|---|---|
| **Tag Icon** | Visual identifier |
| **Category Name** | Uppercase name of the category |
| **Description** | Business context of the category |
| **Active Status** | Green dot indicating the category is active |
| **Created Date** | When the category was created |
| **Edit** (pencil icon) | Opens the edit modal to update name and description |
| **Delete** (trash icon) | Deletes the category after confirmation |

### Category Modal (Add / Edit)

| Field | Description | Required |
|---|---|---|
| **Category Name** | Name of the expense category (e.g., "OFFICE SUPPLIES") | Yes |
| **Business Context** | Description of the category's scope | No |
| **Cancel** | Closes the modal without saving | — |
| **Commit Changes** | Creates or updates the category | — |

---

## 11. Cost Centers (Departments)

> **Access:** Super Admin and Accounting

The **Cost Centers** page manages NKB departments used in the expense entry's "Cost Center" dropdown.

### Page Header Button

| Button | Function |
|---|---|
| **Add Cost Center** | Opens the "New Cost Center" modal |

### Department Cards

| Element | Description |
|---|---|
| **Building Icon** | Visual identifier |
| **Department Name** | Uppercase name (e.g., "PRODUCTION") |
| **Created Date** | When the department was created |
| **Edit** (pencil icon) | Opens the edit modal |
| **Delete** (trash icon) | Deletes the department after confirmation |

### Cost Center Modal

| Field | Description | Required |
|---|---|---|
| **Department Name** | Name of the department | Yes |
| **Cancel** | Closes modal without saving | — |
| **Save** | Creates or updates the department | — |

---

## 12. User Management

> **Access:** Super Admin only  
> Also accessible from **Settings > Users** tab.

The **Access Governance** page manages system user accounts and permissions.

### Page Header Button

| Button | Function |
|---|---|
| **Provision User** | Opens the "Access Provisioning" modal to create a new user |

### User Cards

Each user is displayed as a card with:

| Element | Description |
|---|---|
| **Avatar** | Initials of the user with role-based color coding (rose for Super Admin, blue for others) |
| **Full Name** | User's full name |
| **Role Badge** | Current access tier |
| **Username** | Login ID (prefixed with @) |
| **Department** | Assigned department |
| **Email** | Contact email address |
| **Active Credentials** | Status indicator |
| **Edit** (pencil icon) | Opens the "Manage Security Profile" modal |
| **Edit Policy** (text link) | Same as edit icon |
| **Delete** (trash icon) | Deletes the user after confirmation |

### Access Provisioning Modal (Add / Edit User)

| Field | Description | Required |
|---|---|---|
| **Account ID** | Username for login | Yes |
| **Access Tier** | Role: SUPER ADMIN, ACCOUNTING, MANAGER, or STAFF | Yes |
| **Legal Full Name** | Full name of the user | Yes |
| **Department** | Assigned department dropdown | No |
| **Email Address** | User's email for notifications | No |
| **Initial Authorization Key** | Password (only shown when creating a new user) | Yes (new only) |
| **Discard** | Closes modal without saving | — |
| **Authorize Access** | Creates or updates the user account | — |

---

## 13. Notification Center

> **Full admin features:** Super Admin and Accounting  
> **View-only features:** All users

The **Notification Center** is an enterprise communication hub with real-time alerts, broadcasting, scheduling, and templates.

### Header Buttons (Admin Only)

| Button | Function |
|---|---|
| **Broadcast Alert** | Opens the "Send Broadcast Alert" modal to send an immediate notification |
| **Schedule Alert** | Opens the "Automated Cron Setup" modal to schedule a future notification |

### Tabs

| Tab | Visibility | Description |
|---|---|---|
| **Inbox Feed** | All | Shows all active/unread notifications |
| **Important Alerts** | All | Shows important and critical priority alerts |
| **Archived Messages** | All | Shows archived/dismissed notifications |
| **Sent History & Analytics** | Admin | Shows broadcast history with per-recipient read/acknowledge tracking |
| **Automated Schedules** | Admin | Shows cron-scheduled notifications |
| **Notification Templates** | Admin | Shows reusable notification presets |

### Inbox / Important / Archived — Notification Card Actions

| Button | Function |
|---|---|
| **View Task** (if task link exists) | Opens the associated task URL |
| **Acknowledge Alert** (critical only) | Mutes the critical alarm and marks as acknowledged |
| **Mark Read** | Marks the notification as read |
| **Archive** (archive icon) | Moves the notification to the archive |
| **Restore** (refresh icon, in Archived tab) | Restores an archived notification |

### Search & Filters (Inbox/Important/Archived)

| Control | Function |
|---|---|
| **Search messages** | Text search by title or message content |
| **All Priorities** (dropdown) | Filter by Normal, Important, or Critical priority |
| **All Categories** (dropdown) | Filter by General, Administrative Approval, Treasury & Financials, or System Alert |

### Broadcast Alert Modal (Admin)

| Field | Description | Required |
|---|---|---|
| **Priority Urgency** | Normal, Important (sound once), or Critical (continuous alarm) | Yes |
| **Secure Category** | General, Administrative Approval, Treasury & Financials, or Critical Alerts | Yes |
| **Recipients Scope** | Broadcast to All Users, Specific Departments, or Target Specific Staff | Yes |
| **Department Selection** | Toggle buttons for each department (shown when "Specific Departments" is selected) | Conditional |
| **Staff Selection** | Checkable list of users (shown when "Target Specific Staff" is selected) | Conditional |
| **Alert Title** | Headline for the notification | Yes |
| **Detail Alert Message Body** | Full message content | Yes |
| **Attach Task Link** | Optional internal URL (e.g., /expenses) | No |
| **Attachment Media URL** | Optional public HTTPS link | No |
| **Cancel** | Closes modal without sending | — |
| **Transmit Alert Live** | Sends the notification immediately to selected recipients | — |

### Automated Cron Setup Modal (Admin)

| Field | Description | Required |
|---|---|---|
| **Trigger Execution Date & Time** | When the schedule should first execute | Yes |
| **Recurrence Frequency** | Once, Daily, Weekly, or Monthly | Yes |
| **Template Presets** | Optional pre-population from a saved template | No |
| **Recipients Scope** | All Users or Specific Departments | Yes |
| **Reminder Title** | Headline for the scheduled notification | Yes |
| **Detail Alert Message Body** | Message content | Yes |
| **Cancel** | Closes modal without saving | — |
| **Deploy Schedule Config** | Creates the scheduled notification | — |

### Sent History & Analytics (Admin)

| Element | Description |
|---|---|
| **Broadcast Card** | Shows title, priority badge, message preview, sender, and timestamp. Click to select. |
| **Targets Count** | Number of recipients the broadcast was sent to |
| **Read Rate Progress Bar** | Percentage of recipients who have read the notification |
| **Read / Acknowledge Count** | Number of users who read or acknowledged |
| **Recipient Status Log** | Per-user list showing status (Dispatched, Delivered, Read, Acknowledged) with timestamps |
| **Delete Schedule** (trash icon) | Deletes a scheduled notification after confirmation |

### Notification Templates (Admin)

| Element | Description |
|---|---|
| **Template Card** | Shows type badge, name, subject, and body preview |
| **Edit** (zap icon) | Opens the template in edit mode |
| **Delete** (trash icon) | Permanently removes the template |
| **Load Template** | Pre-fills the Broadcast form with the template's content |
| **Create Template** (button) | Opens the template builder modal |

### Template Builder Modal

| Field | Description | Required |
|---|---|---|
| **Reference Template Name** | Internal name for the template (e.g., Weekly_Audit_Notice) | Yes |
| **Classification Category** | General Announcement, Administrative Approval, Treasury & Financials, or Critical Warnings | Yes |
| **Default Subject Line** | Default title text for notifications using this template | Yes |
| **Default Message Body** | Default message content | Yes |
| **Cancel** | Closes modal without saving | — |
| **Save Preset Template** | Creates or updates the template | — |

### Notification Bell (Header Dropdown)

| Element | Description |
|---|---|
| **Bell Icon** | Opens the notification dropdown. Shows unread count badge. Pulses red for critical alerts. |
| **Mark all read** | Marks all notifications as read |
| **Click notification** | Marks individual notification as read |
| **View All Activity** | Closes dropdown and navigates to the full Notification Center page |

---

## 14. Audit Logs

> **Access:** Super Admin only

The **System Audit Trail** page provides forensic activity tracking.

### Header Info

| Element | Description |
|---|---|
| **Total Events** | Count of all logged events |

### Search & Filter

| Control | Function |
|---|---|
| **Search actions, users, or details** | Full-text search across action, details, and user name fields |
| **Range** (calendar button) | Date range filter (UI placeholder) |
| **Filters** (filter button) | Additional filter options (UI placeholder) |

### Log Table Columns

| Column | Description |
|---|---|
| **Timestamp** | Date and time of the action |
| **User** | Full name and username of the actor |
| **Action** | Type of action, color-coded: LOGIN (blue), CREATE (green), UPDATE/APPROVE (amber), DELETE/REJECT (red) |
| **Details** | Description of what was done |
| **IP Address** | Network IP address of the user at the time of action |

---

## 15. System Maintenance (Backup & Restore)

> **Access:** Super Admin only

The **System Maintenance** page manages data backups and disaster recovery.

### Export System Data Card

| Button | Function |
|---|---|
| **Download .xlsx Backup** | Generates and downloads a comprehensive Excel backup file containing all system records, users, and settings |

### Restore from Backup Card

| Control | Function |
|---|---|
| **Select Backup File** | File upload area that accepts `.xlsx` files only |
| **Initiate Restoration** | Opens a confirmation modal before proceeding |

### Confirmation Modal

| Button | Function |
|---|---|
| **Cancel** | Aborts the restoration |
| **Yes, Restore Data** | Overwrites the current database with the backup file data. **This is destructive — all current data will be replaced.** |

### Critical Protocol Warning

A warning banner reminds users that restoration is a destructive action and to always export a current backup before proceeding.

---

## 16. Queue Monitor

> **Access:** Super Admin only

The **Queue Health Monitor** shows the real-time status of background processes and notification workers.

### Stat Cards

| Card | Description |
|---|---|
| **Active Jobs** | Number of jobs currently being processed |
| **Waiting** | Number of jobs queued for execution |
| **Completed** | Number of successfully delivered jobs |
| **Failed** | Number of jobs that failed and are awaiting manual retry |

### Header Badges

| Element | Description |
|---|---|
| **Redis (BullMQ) Online** | Indicates the queue system is operational |

### Header Button

| Button | Function |
|---|---|
| **Retry All Failed** | Retries all failed jobs in the queue |

### Advanced Queue Management

| Element | Description |
|---|---|
| **Open Technical Dashboard** | Opens the Bull Board interface (at `/admin/queues`) in a new tab for granular job control, real-time progress monitoring, and detailed failure analysis |

---

## 17. Settings

> **Access:** Super Admin only

The **System Configuration** page provides global preferences and administrative settings, organized into tabs.

### Tab Navigation

| Tab | Description |
|---|---|
| **General** | Enterprise identity and system parameters |
| **Users** | Embedded user management (same as User Management page) |
| **Master Data** | Units of measure management |
| **Approval** | Liquidation approval workflow settings |
| **Notifications** | Email and in-app notification channel toggles |
| **Appearance** | Theme settings (currently locked to white) |
| **Security** | Password change form |
| **System** | Database diagnostics and transaction data wipe |

### General Tab

| Field | Description |
|---|---|
| **Company Name** | Organization name displayed in the system |
| **System Currency** | Currency code (default: PHP) |
| **Petty Cash Reservoir Limit** | Maximum petty cash fund limit |
| **Master Administrator Email** | Primary admin contact email |
| **Save Changes** | Persists general settings to the database |

### Master Data Tab — Units of Measure

| Control | Function |
|---|---|
| **New unit input** | Type a new unit name (e.g., "Sack") |
| **Add** button | Adds the new unit to the list |
| **Unit chip** × (close) | Removes a unit from the list |
| **Save Units** | Persists the updated unit list to the database |

### Approval Tab (Approval Settings Panel)

| Setting | Description |
|---|---|
| **Liquidation Approval Threshold (₱)** | Amount at or above which expenses require email approval before liquidation |
| **Primary Approver Email** | Email address of the primary approver who receives approve/decline links |
| **Enable Email Approval** (toggle) | Toggles the email approval workflow on/off |
| **Save Approval Settings** | Saves the approval configuration |

**Additional Approvers (Multi-Level):**

| Control | Function |
|---|---|
| **Approver email** | Email of the additional approver |
| **Name** | Display name of the approver |
| **Level** | Approval level number (Level 1 = primary) |
| **Add** | Adds the additional approver |
| **Delete** (trash icon) | Removes an additional approver |

### Notifications Tab

| Toggle | Function |
|---|---|
| **Email Notifications** | When enabled, sends reports and approval alerts via email |
| **In-App Notifications** | When enabled, shows real-time alerts in the dashboard header |
| **Save Changes** | Saves notification preferences |

> **Note:** Critical system alerts (security breaches, password resets) are always sent via email regardless of preferences.

### Appearance Tab

Displays that the system is currently locked to the **High-Contrast White** theme. Dynamic mode is disabled by policy.

### Security Tab

| Field | Description |
|---|---|
| **Current Authorization Key** | Current password |
| **New Access Credential** | New password (minimum 12 characters) |
| **Update Credentials** | Submits the password change |

### System Tab

| Element | Description |
|---|---|
| **Engine Diagnostics** | Shows database optimization status |
| **Database Optimization Active** (green badge) | Indicates automated maintenance is running |
| **Transaction Data Wipe** | Destructive action that permanently deletes all expense, fund, log, and notification data while preserving users, departments, and categories. Requires confirmation. |
| **Clear All Transaction Records** | Executes the data wipe after confirmation |

### Enterprise Cache Purge (Bottom Card)

| Button | Function |
|---|---|
| **Purge Configuration Data** | Clears all system preferences and session logs. May cause temporary service interruptions. |

---

## 18. Profile & Password

The **Account Configuration** page is accessible to all users from the header (click your name/avatar).

### Profile Card

| Element | Description |
|---|---|
| **Avatar** | Displays user's first initial |
| **Camera icon** (on avatar) | Placeholder for profile photo upload |
| **Full Name** | User's registered name |
| **Role** | Current access tier |
| **Department** | Assigned department |
| **Access Level** | Permission tier description |
| **Security Notice** | Password policy reminder |
| **System Integrity Secure** | Green pulsing status indicator |

### Change Password Form

| Field | Description | Required |
|---|---|---|
| **Current Secret Password** | Your current login password | Yes |
| **New Secure Password** | New password (minimum 8 characters) | Yes |
| **Verify New Password** | Must match the new password exactly | Yes |
| **Save New Credentials** | Submits the password change. Shows success or error message. | — |

> If the new passwords do not match, a red error message appears: *"New passwords do not match"*

---

## 19. Approval Action (Email-Based)

When an expense exceeds the **Liquidation Approval Threshold**, the system sends an email to the configured approver with **Approve** and **Decline** links.

### Approve Flow

1. The approver clicks the **Approve** link in the email.
2. The system verifies the token and automatically processes the approval.
3. A green checkmark and **"Approval Recorded"** message appears.
4. The expense status changes to "Approved" (or "Liquidated").

### Decline Flow

1. The approver clicks the **Decline** link in the email.
2. The system shows the expense details and a **Decline Reason** text area.
3. The approver must enter a reason (required field).
4. Clicking **Submit Decline** records the decline.
5. A red X icon and **"Decline Recorded"** message appears.

### Error Handling

| Scenario | Display |
|---|---|
| Invalid or expired token | Red alert icon with "Unable to Process" message |
| Wrong action type for link | "This link is not valid for approval/decline" |

### Navigation

| Button | Function |
|---|---|
| **Go to Login** | Redirects to the main system login page |

---

## 20. Glossary

| Term | Definition |
|---|---|
| **PCV** | Petty Cash Voucher — a unique reference number assigned to each expense (e.g., PCV-0001) |
| **Liquidation** | The process of finalizing and closing an approved expense, confirming the funds have been spent |
| **Replenishment** | Adding cash back into the petty cash fund (cash-in transaction) |
| **Cost Center** | A department or unit to which expenses are charged |
| **Threshold** | The configured amount above which expenses require email approval for liquidation |
| **Broadcast** | A notification sent to multiple users simultaneously |
| **Cron Job** | A scheduled task that runs automatically at specified times |
| **BullMQ** | The Redis-based job queue system that handles background notification processing |
| **Bull Board** | The administrative interface for monitoring and managing the BullMQ job queue |
| **RBAC** | Role-Based Access Control — the security model that restricts system access based on user roles |
| **Audit Trail** | A chronological record of all system actions, tracking who did what and when |
| **For Approval** | An expense status indicating the amount exceeds the threshold and is awaiting email approval |

---

*This document is the proprietary property of NKB Manufacturing. Unauthorized distribution is prohibited.*
