# NKB Petty Cash System - Deployment Guide (Production)

This guide provides accurate, step-by-step instructions for deploying the NKB Petty Cash System to **Hostinger** using **MySQL**.

## Step 1: Database Setup (Hostinger)
1. Log in to **Hostinger hPanel**.
2. Go to **Databases** -> **MySQL Databases**.
3. Create a new database (e.g., `u335953510_pettycash_db`).
4. Create a database user and assign it to the database with all privileges.
5. **CRITICAL**: Note down the credentials. Use `127.0.0.1` as the `DB_HOST` for stability.

---

## Step 2: Backend & Frontend Preparation
The project is configured to serve the frontend directly from the backend `dist` folder.

1. **Environment Variables**: Create a `.env` file in the `backend/` folder (or root if using the `nodejs` app setup):
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=127.0.0.1
   DB_USER=your_db_user
   DB_NAME=your_db_name
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_secure_random_string
   JWT_EXPIRE=24h
   # Email Automation (Required for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=NKB Petty Cash <noreply@yourdomain.com>
   ```

2. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Sync Files**: Copy everything from `frontend/dist/` to `backend/dist/`.

---

## Step 3: Deployment (Hostinger Node.js App)
1. In hPanel, go to **Websites** -> **Node.js**.
2. Create/Configure the application:
   - **Application Root**: `/domains/pc.nkbmanufacturing.com/nodejs`
   - **App Entry Point**: `index.js` (This wrapper points to `src/index.js`)
3. **Upload**: Push your code via GitHub or use File Manager to upload the `backend/` contents (including `dist/` and `.env`) to the Application Root.

---

## Step 4: Running Migrations
If you encounter "Unknown column" errors, you must run migrations:
1. Temporarily change the **App Entry Point** to `run_migrations.js` in hPanel.
2. **Restart** the application.
3. Check logs to confirm completion.
4. Change the **App Entry Point** back to `index.js` and **Restart**.

---

## Step 5: Troubleshooting
- **500 Internal Server Error**: Check `stderr.log` in the application root.
- **Access Denied (DB)**: Ensure `DB_HOST` is `127.0.0.1` and credentials are correct.
- **Frontend Not Loading**: Ensure the `dist/` folder exists inside your application root.
- **ERR_HTTP2_PROTOCOL_ERROR**: Clear browser cache (`Ctrl+F5`) or check if assets were built with `base: './'`.

---
**NKB Manufacturing © 2026**
