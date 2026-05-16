# 🏛️ NKB Petty Cash System: Deployment & Progress Memory
**Date:** May 15, 2026
**Status:** Dashboard Accessed / Production Ready (Awaiting final UI polish)

## 1. Project Architecture
- **Backend:** Node.js (Express 5.2.1)
- **Frontend:** React + Vite (Served as static files from the backend)
- **Database:** MySQL (Hostinger Managed)
- **Queue System:** Database-driven Fallback (Since Redis is unavailable on Hostinger)

## 2. Server Configuration (Hostinger)
- **Node.js Application:** Running on `pc.nkbmanufacturing.com`
- **Root Directory:** `/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs`
- **Frontend Assets:** Located at `/nodejs/dist`
- **Environment Variables (.env):** 
  - Must be in the root of the `nodejs` folder.
  - **Critical Settings:**
    - `DB_HOST=127.0.0.1` (Para sa IPv4 stability)
    - `JWT_EXPIRE=24h` (Fallback is now in code: `24h`)
    - `PORT=5000`

## 3. Database Schema (MySQL)
Lahat ng tables na ito ay matagumpay na na-create:
1.  **`users`**: Gamit ang `username` (Primary Login) at `password` (Bcrypt).
2.  **`departments`**: Para sa organizational grouping.
3.  **`categories`**: Para sa expense classifications.
4.  **`funds`**: Monitoring ng petty cash balances.
5.  **`expenses`**: Tracking ng lahat ng gastos.
6.  **`expense_attachments`**: Para sa receipt images.
7.  **`activity_logs`**: Audit trail ng lahat ng actions.
8.  **`settings`**: Global system configurations.
9.  **`queue_fallback_jobs`**: Required para sa background tasks (Analytics/Escalations).
10. **`notifications`** & **`notification_preferences`**: Para sa in-app alerts.
11. **`fund_transactions`**: History ng lahat ng pasok at labas ng pera.

### Default Admin Credentials:
- **Username:** `admin`
- **Password:** `admin123`
- **Bcrypt Hash:** `$2b$10$/wk24PG3qrpFLv7lChhrxuFsXrAtW2oML6BDgBYe7LdlPbuTwq2UC`

## 4. Key Fixes Implemented
- **Express 5 Crash:** Ginamit ang Regex literal `/.*/` sa catch-all routing para hindi mag-crash ang Express sa Hostinger.
- **Pathing:** In-update ang `index.js` para gamitin ang `path.join(__dirname, '../dist')` para tama ang pag-serve ng frontend files.
- **JWT Expiry:** Nagdagdag ng fallback `24h` sa `authController.js` para iwas `500 error` sa login.
- **MySQL Access:** Pinalitan ang `localhost` ng `127.0.0.1` para maiwasan ang IPv6 access denied issues.

## 5. Known Issues & Next Steps (For Tomorrow)
- **Browser Error:** `ERR_QUIC_PROTOCOL_ERROR` (Chrome issue) - Solusyon: Disable QUIC or use Edge/Firefox.
- **UI Polish:** I-verify ang lahat ng dashboard cards kung tama ang data na lilitaw pagkatapos mag-insert ng real data.
- **Data Entry:** Simulan ang pag-input ng real departments at categories.

---
**Note to Self:** Bukas, pag-restart, i-check muna ang `stderr.log` kung may bagong crash, pero so far, stable na ang Dashboard access.
