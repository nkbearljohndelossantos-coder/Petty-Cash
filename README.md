# NKB Petty Cash Expense Monitoring System

A professional, production-ready expense monitoring system built for NKB Manufacturing.

## Tech Stack
- **Frontend**: React.js, Vite, TailwindCSS, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Node.js, Express.js, Knex.js, PostgreSQL.
- **Auth**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

## Features
- **Dashboard**: Real-time widgets and expense trend analytics.
- **Expense Monitoring**: Full CRUD with attachments, searching, and filtering.
- **Analytics**: Category breakdown and monthly comparison charts.
- **Security**: Secure login with password hashing and protected routes.
- **Reporting**: Export expenses to Excel.
- **Responsive**: Fully optimized for Desktop and Mobile.
- **Theme**: Support for Dark Mode and System Theme.

## Getting Started

### Prerequisites
- Node.js installed.
- PostgreSQL database.

### Installation

1. **Clone the repository** (if applicable).
2. **Setup Backend**:
   - `cd backend`
   - `npm install`
   - Create `.env` from `.env.example`.
   - `npm run migrate`
   - `npm run seed`
   - `npm run dev`
3. **Setup Frontend**:
   - `cd frontend`
   - `npm install`
   - Create `.env` from `.env.example`.
   - `npm run dev`

## Deployment
Refer to the [deployment_guide.md](deployment_guide.md) for instructions on how to deploy to Hostinger.
