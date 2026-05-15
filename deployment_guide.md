# NKB Petty Cash System - Deployment Guide

This guide provides step-by-step instructions for version controlling your code with **GitHub** and deploying it to **Hostinger**.

## Step 0: GitHub Preparation (Local Machine)
1. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Production Ready"
   ```
2. **Create a GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository.
3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/nkb-petty-cash.git
   git branch -M main
   git push -u origin main
   ```
   > [!IMPORTANT]
   > Ensure the `.gitignore` file is present in the root to avoid uploading your `node_modules` and `.env` files.

---

## Step 1: Database Setup (Hostinger)
1. Log in to **Hostinger hPanel**.
2. Go to **Databases** -> **PostgreSQL Databases**.
3. Create a new database (e.g., `nkb_petty_cash`).
4. Note down the credentials:
   - **DB_NAME**, **DB_USER**, **DB_PASSWORD**, **DB_HOST** (usually `localhost` if on the same server).

---

## Step 2: Backend Deployment (Hostinger Node.js App)
1. In hPanel, go to **Websites** -> **Node.js**.
2. Create a new Node.js application.
3. **Application Root**: `/domains/yourdomain.com/backend`
4. **App Entry Point**: `src/index.js`
5. **Environment Variables**: Add the following in the UI or create a `.env` file in the backend folder:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_USER=u123456789_user
   DB_NAME=u123456789_db
   DB_PASSWORD=your_secure_password
   JWT_SECRET=generate_a_random_string_here
   ```
6. **Install Dependencies**: Click the **npm install** button in hPanel.
7. **Run Migrations**: Use the "Run Script" feature or SSH to run `npm run migrate`.

---

## Step 3: Frontend Deployment
1. On your **Local Machine**, open `frontend/src/services/api.js`.
2. Ensure it uses `import.meta.env.VITE_API_URL`.
3. Create/update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```
4. Build the project:
   ```bash
   cd frontend
   npm run build
   ```
5. **Upload**: Use the **File Manager** to upload everything inside `frontend/dist/` to your Hostinger `public_html` folder.
   - *Note: The `.htaccess` file created in `public/` is automatically included to handle React Router links.*

---

## Step 4: SSL & Domain
1. Ensure **HTTPS** is enabled on Hostinger for both frontend and backend.
2. If your API is on a subdomain (e.g., `api.yourdomain.com`), ensure it is correctly mapped to the Node.js application.

---

## Support
For technical assistance, please refer to the internal documentation.

