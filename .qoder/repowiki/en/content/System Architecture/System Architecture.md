# System Architecture

<cite>
**Referenced Files in This Document**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/knexfile.js](file://backend/knexfile.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/routes/auth.js](file://backend/src/routes/auth.js)
- [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js)
- [backend/src/routes/expenses.js](file://backend/src/routes/expenses.js)
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- [backend/src/utils/logService.js](file://backend/src/utils/logService.js)
- [backend/src/services/emailService.js](file://backend/src/services/emailService.js)
- [frontend/src/main.jsx](file://frontend/src/main.jsx)
- [backend/package.json](file://backend/package.json)
- [frontend/package.json](file://frontend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the full-stack architecture of the petty cash management system. It covers the frontend React application, backend Node.js/Express server, database layer, and external integrations. The backend follows a layered architecture with controllers, services, middleware, and database abstraction. Real-time communication is implemented via Socket.IO, and background tasks leverage a queue system with Redis/BullMQ and a database fallback. Cross-cutting concerns include authentication, logging, error handling, and operational observability.

## Project Structure
The system is organized into two primary directories:
- backend: Express server, controllers, services, middleware, database configuration, migrations, and seeds
- frontend: React SPA with routing, context providers, and UI components

```mermaid
graph TB
subgraph "Backend"
A["Express Server<br/>src/index.js"]
B["Controllers<br/>src/controllers/*"]
C["Services<br/>src/services/*"]
D["Middleware<br/>src/middleware/*"]
E["Database Config<br/>src/config/db.js"]
F["Migrations & Seeds<br/>src/db/migrations/*, src/db/seeds/*"]
end
subgraph "Frontend"
G["React App Root<br/>frontend/src/main.jsx"]
H["Pages & Components<br/>frontend/src/pages/*, frontend/src/components/*"]
I["Context Providers<br/>frontend/src/context/*"]
J["API Service<br/>frontend/src/services/api.js"]
end
A --> B
A --> C
A --> D
A --> E
E --> F
G --> J
H --> J
I --> J
```

**Diagram sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)
- [frontend/src/main.jsx](file://frontend/src/main.jsx)

**Section sources**
- [backend/src/index.js](file://backend/src/index.js)
- [frontend/src/main.jsx](file://frontend/src/main.jsx)

## Core Components
- Express server initializes services, runs database migrations and schema repairs, sets up middleware, routes, static serving, and error handling.
- Controllers orchestrate request handling and delegate to services and database queries.
- Services encapsulate domain logic (e.g., notifications, email, sockets, queues, scheduling).
- Middleware enforces authentication and authorization.
- Database layer abstracted via Knex with MySQL2 client and migrations/seeds.
- Frontend is a React SPA using routing and context providers, communicating with the backend via HTTP and Socket.IO.

Key implementation references:
- Server bootstrap and middleware: [backend/src/index.js](file://backend/src/index.js)
- Database configuration: [backend/src/config/db.js](file://backend/src/config/db.js), [backend/knexfile.js](file://backend/knexfile.js)
- Auth middleware: [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- Auth controller: [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js), [backend/src/routes/auth.js](file://backend/src/routes/auth.js)
- Expense controller and routes: [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js), [backend/src/routes/expenses.js](file://backend/src/routes/expenses.js)
- Socket service: [backend/src/services/socketService.js](file://backend/src/services/socketService.js)
- Queue manager: [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- Logging utility: [backend/src/utils/logService.js](file://backend/src/utils/logService.js)
- Email service: [backend/src/services/emailService.js](file://backend/src/services/emailService.js)

**Section sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)
- [backend/knexfile.js](file://backend/knexfile.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/routes/auth.js](file://backend/src/routes/auth.js)
- [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js)
- [backend/src/routes/expenses.js](file://backend/src/routes/expenses.js)
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- [backend/src/utils/logService.js](file://backend/src/utils/logService.js)
- [backend/src/services/emailService.js](file://backend/src/services/emailService.js)

## Architecture Overview
The system employs a layered backend architecture with clear separation of concerns:
- Presentation Layer: Express routes and controllers
- Application Layer: Business logic in services
- Persistence Layer: Knex queries against MySQL
- Integration Layer: SMTP email, Redis/BullMQ queues, Socket.IO

```mermaid
graph TB
FE["Frontend React App<br/>frontend/src/main.jsx"]
API["Express Server<br/>backend/src/index.js"]
AUTH["Auth Middleware<br/>backend/src/middleware/auth.js"]
CTRL_AUTH["Auth Controller<br/>backend/src/controllers/authController.js"]
CTRL_EXP["Expense Controller<br/>backend/src/controllers/expenseController.js"]
SVC_EMAIL["Email Service<br/>backend/src/services/emailService.js"]
SVC_QUEUE["Queue Manager<br/>backend/src/services/queueManager.js"]
SVC_SOCKET["Socket Service<br/>backend/src/services/socketService.js"]
DB_CFG["Knex Config<br/>backend/src/config/db.js"]
DB_MIG["Migrations & Seeds<br/>backend/src/db/migrations/*, backend/src/db/seeds/*"]
FE --> |HTTP + Socket.IO| API
API --> AUTH
API --> CTRL_AUTH
API --> CTRL_EXP
CTRL_AUTH --> DB_CFG
CTRL_EXP --> DB_CFG
CTRL_EXP --> SVC_EMAIL
CTRL_EXP --> SVC_QUEUE
CTRL_EXP --> SVC_SOCKET
DB_CFG --> DB_MIG
```

**Diagram sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js)
- [backend/src/services/emailService.js](file://backend/src/services/emailService.js)
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)

## Detailed Component Analysis

### Authentication Flow
The authentication flow uses JWT tokens passed via Authorization header. The middleware validates tokens and attaches user info to the request. Protected routes enforce roles where applicable.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant API as "Express Server"
participant Ctrl as "Auth Controller"
participant MW as "Auth Middleware"
participant DB as "Database"
Client->>API : POST /api/auth/login {username,password}
API->>Ctrl : login()
Ctrl->>DB : select user by username
DB-->>Ctrl : user record
Ctrl->>Ctrl : verify password
Ctrl->>Ctrl : sign JWT token
Ctrl-->>API : {token,user}
API-->>Client : response
Client->>API : GET /api/auth/me (Authorization : Bearer <token>)
API->>MW : protect()
MW->>MW : verify JWT
MW->>DB : fetch user by id
DB-->>MW : user
MW-->>API : attach req.user
API->>Ctrl : getMe()
Ctrl-->>API : {data : user}
API-->>Client : response
```

**Diagram sources**
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/routes/auth.js](file://backend/src/routes/auth.js)

**Section sources**
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/routes/auth.js](file://backend/src/routes/auth.js)

### Expense Management Workflow
The expense module demonstrates CRUD operations, file uploads, approval workflows, notifications, and real-time updates.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant API as "Express Server"
participant Ctrl as "Expense Controller"
participant DB as "Database"
participant Q as "Queue Manager"
participant S as "Socket Service"
participant E as "Email Service"
Client->>API : POST /api/expenses (multipart/form-data)
API->>Ctrl : createExpense()
Ctrl->>DB : insert expense
DB-->>Ctrl : new id
alt Requires Approval
Ctrl->>Q : add job (approval workflow)
Ctrl->>E : sendApprovalEmail()
Ctrl->>S : broadcast("expense_updated","For Approval")
else No Approval
Ctrl->>S : broadcast("balance_updated"/"expense_updated")
end
Ctrl-->>API : {success,data}
API-->>Client : response
```

**Diagram sources**
- [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js)
- [backend/src/routes/expenses.js](file://backend/src/routes/expenses.js)
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)
- [backend/src/services/emailService.js](file://backend/src/services/emailService.js)

**Section sources**
- [backend/src/controllers/expenseController.js](file://backend/src/controllers/expenseController.js)
- [backend/src/routes/expenses.js](file://backend/src/routes/expenses.js)

### Real-Time Communication Architecture
Socket.IO enables real-time notifications and broadcasts. Connections are optionally authenticated using JWT tokens passed during handshake. The service tracks per-user sockets and supports targeted and broadcast events.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant IO as "Socket Service"
participant Admin as "Admin Client"
participant User as "User Client"
Client->>IO : connect (optional token)
IO->>IO : verify token (optional)
IO-->>Client : connected
Admin->>IO : emit "sendNotification"(data)
IO->>IO : broadcast "receiveNotification"
IO->>IO : broadcast "new_notification"
IO-->>User : events
```

**Diagram sources**
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)

**Section sources**
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)

### Background Task Queue and Fallback
The queue manager supports Redis-backed queues via BullMQ with automatic fallback to database-backed jobs when Redis is unavailable. Jobs are processed with retries and exponential backoff.

```mermaid
flowchart TD
Start(["Add Job"]) --> CheckRedis{"Using Redis?"}
CheckRedis --> |Yes| UseRedis["Create Queue (BullMQ)<br/>Add Job with attempts/backoff"]
CheckRedis --> |No| UseDB["Insert into queue_fallback_jobs"]
UseRedis --> Done(["Done"])
UseDB --> Done
```

**Diagram sources**
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)

**Section sources**
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)

### Database Initialization, Migrations, and Schema Repair
On startup, the server ensures the database is reachable, runs migrations, and performs schema repair checks for critical tables and columns. It also initializes supporting services (sockets, queues, scheduler) and sets up Bull Board for queue monitoring when Redis is enabled.

```mermaid
flowchart TD
Init(["Server Startup"]) --> PingDB["Ping DB"]
PingDB --> RunMigrations["Run Knex Migrations"]
RunMigrations --> Repair["Schema Repair Engine"]
Repair --> CheckTables{"Core Tables Exist?"}
CheckTables --> |Missing| Rebuild["Apply Migration Up"]
CheckTables --> |Exists| CheckColumns{"Required Columns Present?"}
CheckColumns --> |Missing| Patch["Apply Column Migration Up"]
CheckColumns --> |Present| Approve["Ensure Approval Schema"]
Rebuild --> Approve
Patch --> Approve
Approve --> InitServices["Init Sockets/Queues/Scheduler"]
InitServices --> BullBoard{"Redis Enabled?"}
BullBoard --> |Yes| SetupBB["Setup Bull Board"]
BullBoard --> |No| SkipBB["Skip Bull Board"]
SetupBB --> Ready(["Ready"])
SkipBB --> Ready
```

**Diagram sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)

**Section sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)

## Dependency Analysis
External dependencies include Express, Knex, Socket.IO, BullMQ, Nodemailer, and others. The frontend uses React, React Router, Axios, and Socket.IO client. Build and dev scripts coordinate frontend and backend.

```mermaid
graph LR
subgraph "Backend"
BE_pkg["backend/package.json"]
Express["express"]
Knex["knex + mysql2"]
Socket["socket.io"]
Bull["bullmq + ioredis"]
Mail["nodemailer"]
Cors["cors"]
Morgan["morgan"]
JWT["jsonwebtoken"]
BCrypt["bcryptjs"]
end
subgraph "Frontend"
FE_pkg["frontend/package.json"]
React["react + react-dom"]
Router["react-router-dom"]
Axios["axios"]
SockCli["socket.io-client"]
end
BE_pkg --> Express
BE_pkg --> Knex
BE_pkg --> Socket
BE_pkg --> Bull
BE_pkg --> Mail
BE_pkg --> Cors
BE_pkg --> Morgan
BE_pkg --> JWT
BE_pkg --> BCrypt
FE_pkg --> React
FE_pkg --> Router
FE_pkg --> Axios
FE_pkg --> SockCli
```

**Diagram sources**
- [backend/package.json](file://backend/package.json)
- [frontend/package.json](file://frontend/package.json)

**Section sources**
- [backend/package.json](file://backend/package.json)
- [frontend/package.json](file://frontend/package.json)

## Performance Considerations
- Database scaling: Use read replicas and optimize queries with proper indexing on frequently filtered columns (e.g., expenses.status, expenses.date, users.username).
- Queue throughput: Prefer Redis-backed queues for high concurrency; monitor queue backlog and adjust worker counts.
- Real-time load: Limit broadcast events to essential updates; use targeted user events where possible.
- Static assets: Serve frontend dist with cache headers; ensure CDN caching for immutable assets.
- Background jobs: Tune retry delays and limits; batch processing for large datasets.
- Logging: Offload logs to external systems; avoid synchronous disk writes in hot paths.

## Troubleshooting Guide
Common areas to inspect:
- Authentication failures: Verify JWT secret and token issuance; confirm middleware protection is applied to protected routes.
- Database connectivity: Confirm environment variables for host, user, password, and database; ensure migrations ran successfully.
- Email delivery: Check SMTP configuration; verify templates exist and transport verification passes.
- Queue issues: Validate Redis availability; review Bull Board for stalled jobs; inspect fallback queue entries.
- Real-time events: Ensure clients reconnect after token changes; verify socket handshake includes token.

Operational references:
- Server startup and error handling: [backend/src/index.js](file://backend/src/index.js)
- Auth middleware and protected routes: [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js), [backend/src/routes/auth.js](file://backend/src/routes/auth.js)
- Database configuration and migrations: [backend/src/config/db.js](file://backend/src/config/db.js), [backend/knexfile.js](file://backend/knexfile.js)
- Activity logging: [backend/src/utils/logService.js](file://backend/src/utils/logService.js)
- Email service diagnostics: [backend/src/services/emailService.js](file://backend/src/services/emailService.js)
- Queue diagnostics: [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- Socket diagnostics: [backend/src/services/socketService.js](file://backend/src/services/socketService.js)

**Section sources**
- [backend/src/index.js](file://backend/src/index.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/routes/auth.js](file://backend/src/routes/auth.js)
- [backend/src/config/db.js](file://backend/src/config/db.js)
- [backend/knexfile.js](file://backend/knexfile.js)
- [backend/src/utils/logService.js](file://backend/src/utils/logService.js)
- [backend/src/services/emailService.js](file://backend/src/services/emailService.js)
- [backend/src/services/queueManager.js](file://backend/src/services/queueManager.js)
- [backend/src/services/socketService.js](file://backend/src/services/socketService.js)

## Conclusion
The system is designed with clear separation of concerns, robust middleware for security, and scalable background processing. The layered architecture, combined with real-time capabilities and comprehensive logging, provides a solid foundation for a petty cash management platform. Proper configuration of external services (database, Redis, SMTP) and adherence to operational practices will ensure reliability and maintainability at scale.