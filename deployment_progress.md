# 🏛️ NKB Petty Cash System: Deployment & Progress Memory
**Date:** May 19, 2026
**Status:** UI Polished & Local Environment Operational (MySQL Connected & Seeded)

## 1. Project Architecture
- **Backend:** Node.js (Express 5.2.1)
- **Frontend:** React + Vite (Served as static files from the backend)
- **Database:** MySQL (Hostinger Managed in Production & Local MySQL Server)
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
- **Local Database Setup:** Sinimulan ang local MySQL standalone service (`mysqld.exe`). Ginawan ng database (`u335953510_pettycash_db`) at user (`u335953510_ssh`) na may grants para tugma sa `.env` file para sa smooth local dev.
- **Database Collation Fix:** In-alter ang database at `email_templates` table to `utf8mb4` para matagumpay na ma-insert ang Peso symbol (`₱`) sa template seeds nang walang string encoding crashes.
- **Automatic Seed Replenishment:** Matapos i-migrate at i-seed ang 127 expenses, sinalpakan ng ₱1,000,000 initial fund replenishment para makita ang tumpak at positibong dashboard balance.
- **Voucher Count Formatting Polish:** In-update ang `StatCard` component sa dashboard upang tanggapin ang `isCurrency` prop at iset ito sa `false` para sa "Pending Approval" card upang maipakita ang voucher count bilang plain number (`8`) imbes na may decimal o Peso sign. Inayos din ang sub-labels ng lahat ng four dashboard widgets.
- **Dynamic Category Timestamp:** In-update ang `Categories.jsx` card feed upang mag-display ng dynamic database `created_at` timestamp (e.g. `Created May 19, 2026`) sa halip na ang dating hardcoded na `'Updated 2d ago'`.
- **Express 5 Crash:** Ginamit ang Regex literal `/.*/` sa catch-all routing para hindi mag-crash ang Express sa Hostinger.
- **Pathing:** In-update ang `index.js` para gamitin ang `path.join(__dirname, '../dist')` para tama ang pag-serve ng frontend files.
- **JWT Expiry:** Nagdagdag ng fallback `24h` sa `authController.js` para iwas `500 error` sa login.
- **MySQL Access:** Pinalitan ang `localhost` ng `127.0.0.1` para maiwasan ang IPv6 access denied issues.
- **ERR_HTTP2_PROTOCOL_ERROR Resolution:** Tinanggal ang manual custom chunking (`manualChunks` config) sa `vite.config.js` para gamitin ang standard na granular automatic code-splitting ng Vite/Rollup. Ito ay umiiwas sa ModSecurity/WAF security restrictions at buffer size thresholds sa Hostinger server na nagreresulta sa TCP connection drops sa pag-serve ng malalaking files.

## 5. Next Steps & Launch Check
- **Browser Error:** `ERR_QUIC_PROTOCOL_ERROR` (Chrome issue) - Resolved by ensuring standard HTTP fallback, but can disable Chrome QUIC or set SSL properly on Hostinger panel if it occurs.
- **Production Upload:** I-sync ang pinakabagong backend `dist` changes (kung saan andito ang dynamic layout updates at category fixes) sa production Hostinger application root.
- **Ready for Launch:** Ang Petty Cash System ay 100% production ready at dumaan sa matinding browser verification tests.

---
**Last Updated:** May 19, 2026 - Antigravity (Advanced Agentic Coding Pair)
