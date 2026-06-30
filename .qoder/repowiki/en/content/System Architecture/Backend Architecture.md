# Backend Architecture

<cite>
**Referenced Files in This Document**
- [index.js](file://backend/src/index.js)
- [db.js](file://backend/src/config/db.js)
- [auth.js](file://backend/src/middleware/auth.js)
- [knexfile.js](file://backend/knexfile.js)
- [authController.js](file://backend/src/controllers/authController.js)
- [auth.js](file://backend/src/routes/auth.js)
- [queueManager.js](file://backend/src/services/queueManager.js)
- [socketService.js](file://backend/src/services/socketService.js)
- [logService.js](file://backend/src/utils/logService.js)
- [run_migrations.js](file://backend/run_migrations.js)
- [20260512000000_initial_schema.js](file://backend/src/db/migrations/20260512000000_initial_schema.js)
- [20260512075907_create_funds_table.js](file://backend/src/db/migrations/20260512075907_create_funds_table.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)
- [package.json](file://backend/package.json)
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
This document describes the backend architecture of a Node.js/Express-based petty cash management system. It focuses on server initialization, database connectivity and migrations, authentication middleware, layered architecture (controllers, services, database abstraction), middleware stack, error handling, request/response flow, configuration and environment management, dependency injection patterns, security, logging, and performance optimization.

## Project Structure
The backend follows a modular, layered structure:
- Entry point initializes services, runs migrations, sets up middleware, routes, and static assets.
- Configuration module encapsulates Knex database setup.
- Controllers handle HTTP endpoints and delegate to services.
- Services manage business logic, queueing, scheduling, and real-time communication.
- Utilities provide reusable helpers like logging.
- Knex migrations define and evolve the schema.
- Environment configuration is loaded via dotenv.

```mermaid
graph TB
Entry["Entry Point<br/>backend/src/index.js"]
Config["DB Config<br/>backend/src/config/db.js"]
KnexFile["Knex Config<br/>backend/knexfile.js"]
AuthMW["Auth Middleware<br/>backend/src/middleware/auth.js"]
Routes["Route Modules<br/>backend/src/routes/*.js"]
Controllers["Controllers<br/>backend/src/controllers/*.js"]
Services["Services<br/>backend/src/services/*.js"]
Utils["Utilities<br/>backend/src/utils/*.js"]
Migrations["Migrations<br/>backend/src/db/migrations/*.js"]
Entry --> Config
Entry --> Services
Entry --> Routes
Routes --> Controllers
Controllers --> Config
Controllers --> Utils
Services --> Config
Services --> Utils
Config --> KnexFile
Entry --> Migrations
```

**Diagram sources**
- [index.js:1-240](file://backend/src/index.js#L1-L240)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)
- [auth.js:1-10](file://backend/src/routes/auth.js#L1-L10)
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)
- [socketService.js:1-102](file://backend/src/services/socketService.js#L1-L102)
- [logService.js:1-24](file://backend/src/utils/logService.js#L1-L24)
- [20260512000000_initial_schema.js:1-159](file://backend/src/db/migrations/20260512000000_initial_schema.js#L1-L159)
- [20260512075907_create_funds_table.js:1-44](file://backend/src/db/migrations/20260512075907_create_funds_table.js#L1-L44)

**Section sources**
- [index.js:1-240](file://backend/src/index.js#L1-L240)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)

## Core Components
- Server Initialization and Lifecycle
  - Loads environment variables, initializes HTTP server, and registers middleware and routes.
  - Performs database diagnostics, runs migrations, and applies schema repair engine.
  - Initializes background services: queue manager, workers, scheduler, and Socket.IO.
  - Exposes admin UI for queue monitoring when Redis is enabled.
  - Serves frontend static assets in production and handles SPA fallback.
  - Registers global error handler and health check endpoint.
- Database Abstraction and Migration
  - Knex configured per environment with MySQL client.
  - Migration runner invoked during startup and via dedicated script.
  - Repair engine ensures critical tables and columns exist and are complete.
- Authentication Middleware
  - Validates JWT tokens from Authorization header and attaches user context.
  - Role-based authorization guard supports role checks.
- Layered Architecture
  - Controllers: route handlers for HTTP endpoints.
  - Services: business logic, queueing, scheduling, and real-time features.
  - Database Abstraction: Knex queries executed through centralized config.
  - Utilities: logging and other shared helpers.

**Section sources**
- [index.js:1-240](file://backend/src/index.js#L1-L240)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)

## Architecture Overview
The system uses a layered architecture with clear separation of concerns:
- Presentation Layer: Express routes and controllers.
- Application Layer: Services orchestrating business logic.
- Persistence Layer: Knex-based database abstraction.
- Infrastructure Layer: Background jobs, sockets, and environment configuration.

```mermaid
graph TB
subgraph "Presentation"
RAuth["/api/auth routes"]
CAuth["authController"]
end
subgraph "Application"
SAuth["auth middleware"]
SNotify["notificationDispatcher"]
SQueue["queueManager"]
SSocket["socketService"]
end
subgraph "Persistence"
K["Knex Config"]
DB["MySQL Database"]
end
RAuth --> CAuth
CAuth --> SAuth
CAuth --> K
SNotify --> SQueue
SNotify --> SSocket
SQueue --> K
SSocket --> K
K --> DB
```

**Diagram sources**
- [index.js:160-178](file://backend/src/index.js#L160-L178)
- [auth.js:1-10](file://backend/src/routes/auth.js#L1-L10)
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)
- [notificationDispatcher.js:1-68](file://backend/src/services/notificationDispatcher.js#L1-L68)
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)
- [socketService.js:1-102](file://backend/src/services/socketService.js#L1-L102)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)

## Detailed Component Analysis

### Server Initialization and Startup Flow
The entry point coordinates:
- Environment loading and service initialization.
- Database connectivity test and migration execution.
- Schema repair engine to ensure completeness.
- Queue manager, workers, scheduler, and Socket.IO setup.
- Middleware registration (CORS, JSON parsing, Morgan logging).
- Route mounting and static asset serving.
- Global error handler and health check.

```mermaid
sequenceDiagram
participant Proc as "Process"
participant Entry as "index.js"
participant DB as "db.js"
participant Mig as "knex.migrate"
participant Rep as "Schema Repair Engine"
participant QMgr as "queueManager.js"
participant Sock as "socketService.js"
Proc->>Entry : "Start process"
Entry->>DB : "Connect and test raw('SELECT 1')"
Entry->>Mig : "forceFreeMigrationsLock()"
Entry->>Mig : "migrate.latest()"
Mig-->>Entry : "Batch info and logs"
Entry->>Rep : "Check core tables and columns"
Rep-->>Entry : "Repair actions completed"
Entry->>QMgr : "initQueueManager()"
Entry->>QMgr : "initWorkers()"
Entry->>QMgr : "initScheduler()"
Entry->>Sock : "initSocket(server)"
Entry-->>Proc : "Listen on PORT"
```

**Diagram sources**
- [index.js:28-149](file://backend/src/index.js#L28-L149)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [run_migrations.js:1-21](file://backend/run_migrations.js#L1-L21)

**Section sources**
- [index.js:28-149](file://backend/src/index.js#L28-L149)
- [run_migrations.js:1-21](file://backend/run_migrations.js#L1-L21)

### Database Connection Management and Migration System
- Knex configuration is environment-driven and loaded from a central file.
- During startup, the system forces free migration locks, runs latest migrations, and logs results.
- A robust schema repair engine validates and reconstructs missing tables/columns, including specialized patches for expenses and notifications.
- A separate migration runner script is available for CI/CD or manual operations.

```mermaid
flowchart TD
Start(["Startup"]) --> LoadEnv["Load Env Variables"]
LoadEnv --> ConnectDB["Test DB Connection"]
ConnectDB --> ForceLock["Force Free Migration Lock"]
ForceLock --> RunMigs["Run Latest Migrations"]
RunMigs --> CheckLogs{"Any migrations run?"}
CheckLogs --> |Yes| LogMigs["Log Batch and Migration Names"]
CheckLogs --> |No| SkipLogs["Schema Up-to-Date"]
LogMigs --> Repair["Schema Repair Engine"]
SkipLogs --> Repair
Repair --> CoreTables["Check Core Tables Existence"]
CoreTables --> HasMissing{"Any Missing?"}
HasMissing --> |Yes| ApplyPatch["Apply Targeted Patches"]
HasMissing --> |No| ApproveWorkflow["Ensure Approval Schema"]
ApplyPatch --> ApproveWorkflow
ApproveWorkflow --> End(["Ready"])
```

**Diagram sources**
- [index.js:32-118](file://backend/src/index.js#L32-L118)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [20260512000000_initial_schema.js:1-159](file://backend/src/db/migrations/20260512000000_initial_schema.js#L1-L159)
- [20260512075907_create_funds_table.js:1-44](file://backend/src/db/migrations/20260512075907_create_funds_table.js#L1-L44)

**Section sources**
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [index.js:32-118](file://backend/src/index.js#L32-L118)

### Authentication Middleware Implementation
- Request protection verifies Authorization Bearer token and decodes JWT.
- Role-based authorization enforces allowed roles.
- On success, the authenticated user object is attached to the request for downstream use.

```mermaid
flowchart TD
Req["Incoming Request"] --> CheckHeader["Check Authorization Header"]
CheckHeader --> HasToken{"Has Bearer Token?"}
HasToken --> |No| Unauthorized["401 Not Authorized"]
HasToken --> |Yes| VerifyToken["Verify JWT with Secret"]
VerifyToken --> Verified{"Valid Token?"}
Verified --> |No| Unauthorized
Verified --> |Yes| AttachUser["Attach User to Request"]
AttachUser --> Next["Call Next Handler"]
```

**Diagram sources**
- [auth.js:3-21](file://backend/src/middleware/auth.js#L3-L21)

**Section sources**
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)

### Middleware Stack and Request/Response Flow
- Order of middleware: CORS, JSON body parsing, URL-encoded parsing, Morgan logging.
- Static upload serving and SPA fallback routing.
- Route modules import controllers and apply middleware where needed.
- Global error handler responds with structured JSON.

```mermaid
sequenceDiagram
participant Client as "Client"
participant App as "Express App"
participant MW1 as "CORS"
participant MW2 as "JSON/URL-Encoding"
participant MW3 as "Morgan"
participant Routes as "Route Module"
participant Ctrl as "Controller"
participant DB as "Knex"
participant Err as "Global Error Handler"
Client->>App : "HTTP Request"
App->>MW1 : "Pre-process"
MW1->>MW2 : "Next"
MW2->>MW3 : "Next"
MW3->>Routes : "Dispatch"
Routes->>Ctrl : "Invoke Handler"
Ctrl->>DB : "Execute Queries"
DB-->>Ctrl : "Results"
Ctrl-->>Client : "Response"
Note over App,Err : "On error, global handler returns JSON"
```

**Diagram sources**
- [index.js:151-178](file://backend/src/index.js#L151-L178)
- [auth.js:1-10](file://backend/src/routes/auth.js#L1-L10)
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)

**Section sources**
- [index.js:151-178](file://backend/src/index.js#L151-L178)
- [auth.js:1-10](file://backend/src/routes/auth.js#L1-L10)
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)

### Layered Architecture Pattern: Controllers, Services, Database Abstraction
- Controllers: Thin HTTP handlers that validate inputs, call services, and return responses.
- Services: Encapsulate business logic, integrate with queueing, scheduling, and real-time features.
- Database Abstraction: Centralized Knex configuration consumed by controllers and services.

```mermaid
classDiagram
class AuthController {
+login(req,res)
+getMe(req,res)
}
class AuthMiddleware {
+protect(req,res,next)
+authorize(...roles)(req,res,next)
}
class QueueManager {
+initQueueManager()
+addJob(name,data,options)
+getQueue(name)
+processDBJobs(processorMap)
+isUsingRedis()
}
class SocketService {
+initSocket(server)
+sendToUser(userId,event,data)
+broadcast(event,data)
}
class LogService {
+logActivity(userId,action,details,ip)
}
class KnexConfig {
+knex instance
}
AuthController --> AuthMiddleware : "uses"
AuthController --> KnexConfig : "queries"
AuthController --> LogService : "logs"
QueueManager --> KnexConfig : "fallback"
SocketService --> KnexConfig : "optional"
```

**Diagram sources**
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)
- [socketService.js:1-102](file://backend/src/services/socketService.js#L1-L102)
- [logService.js:1-24](file://backend/src/utils/logService.js#L1-L24)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)

**Section sources**
- [authController.js:1-66](file://backend/src/controllers/authController.js#L1-L66)
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)
- [socketService.js:1-102](file://backend/src/services/socketService.js#L1-L102)
- [logService.js:1-24](file://backend/src/utils/logService.js#L1-L24)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)

### Background Jobs and Queue Management
- Queue manager supports Redis-backed BullMQ with graceful fallback to database-backed jobs.
- Automatic retry and exponential backoff for Redis jobs; database fallback persists pending jobs.
- Scheduler and workers are initialized at startup; optional Bull Board UI is exposed when Redis is enabled.

```mermaid
flowchart TD
Init["Init Queue Manager"] --> RedisEnabled{"REDIS_ENABLED == false?"}
RedisEnabled --> |Yes| UseDB["Use Database Fallback"]
RedisEnabled --> |No| ConnectRedis["Connect to Redis"]
ConnectRedis --> Ping{"Ping OK?"}
Ping --> |No| UseDB
Ping --> |Yes| UseRedis["Use BullMQ"]
UseRedis --> AddJob["addJob(queueName, jobName, data, options)"]
AddJob --> RedisPath{"Using Redis?"}
RedisPath --> |Yes| RedisAdd["Queue.add(...) with retries/backoff"]
RedisPath --> |No| DBInsert["Insert into queue_fallback_jobs"]
UseDB --> DBLoop["processDBJobs()"]
DBLoop --> Fetch["Select pending jobs by priority and time"]
Fetch --> ForEach["For each job, call processor"]
ForEach --> Success["Mark completed"]
ForEach --> Failure["Increment attempts and schedule retry"]
```

**Diagram sources**
- [queueManager.js:9-116](file://backend/src/services/queueManager.js#L9-L116)

**Section sources**
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)

### Real-Time Notifications and Broadcasting
- Socket.IO server is initialized with JWT-based flexible authentication.
- Notification dispatcher writes in-app notifications and optionally enqueues emails via queue manager.
- Real-time updates are sent to connected clients per user session.

```mermaid
sequenceDiagram
participant Service as "notificationDispatcher.js"
participant DB as "Knex"
participant Socket as "socketService.js"
participant Queue as "queueManager.js"
participant User as "Client"
Service->>DB : "Get user preferences"
alt In-App Enabled
Service->>DB : "Insert notification row"
Service->>Socket : "sendToUser(userId, 'new_notification', payload)"
Socket-->>User : "Emit real-time notification"
end
alt Email Enabled and Template Provided
Service->>DB : "Lookup user email"
Service->>Queue : "addJob('email','send_notification_email', data)"
end
```

**Diagram sources**
- [notificationDispatcher.js:5-63](file://backend/src/services/notificationDispatcher.js#L5-L63)
- [socketService.js:77-86](file://backend/src/services/socketService.js#L77-L86)
- [queueManager.js:61-85](file://backend/src/services/queueManager.js#L61-L85)

**Section sources**
- [notificationDispatcher.js:1-68](file://backend/src/services/notificationDispatcher.js#L1-L68)
- [socketService.js:1-102](file://backend/src/services/socketService.js#L1-L102)
- [queueManager.js:1-126](file://backend/src/services/queueManager.js#L1-L126)

### Logging Strategy
- Activity logging utility inserts records into the activity logs table.
- Controllers leverage logging for audit trails (e.g., login events).
- Morgan provides HTTP request logging.

**Section sources**
- [logService.js:1-24](file://backend/src/utils/logService.js#L1-L24)
- [authController.js:20-47](file://backend/src/controllers/authController.js#L20-L47)
- [index.js:155-155](file://backend/src/index.js#L155-L155)

### Security Implementations
- JWT-based authentication with protected routes and role-based authorization.
- CORS enabled; Socket.IO handshake supports token-based identification.
- Environment variables for secrets and database credentials.

**Section sources**
- [auth.js:1-36](file://backend/src/middleware/auth.js#L1-L36)
- [socketService.js:16-27](file://backend/src/services/socketService.js#L16-L27)
- [knexfile.js:7-11](file://backend/knexfile.js#L7-L11)

### Environment Management and Dependency Injection
- Environment variables loaded via dotenv at startup.
- Knex instance injected as a singleton module for reuse across controllers and services.
- Services depend on the Knex module rather than hardcoding connections.

**Section sources**
- [index.js:3-5](file://backend/src/index.js#L3-L5)
- [db.js:1-8](file://backend/src/config/db.js#L1-L8)
- [package.json:1-50](file://backend/package.json#L1-L50)

## Dependency Analysis
External dependencies include Express, Knex, BullMQ, Socket.IO, Morgan, JWT, and others. The system uses a centralized Knex configuration and environment-driven setup.

```mermaid
graph TB
Pkg["package.json"]
Express["express"]
Knex["knex + mysql2"]
BullMQ["bullmq + ioredis"]
SocketIO["socket.io"]
JWT["jsonwebtoken"]
Morgan["morgan"]
Cors["cors"]
Dotenv["dotenv"]
Pkg --> Express
Pkg --> Knex
Pkg --> BullMQ
Pkg --> SocketIO
Pkg --> JWT
Pkg --> Morgan
Pkg --> Cors
Pkg --> Dotenv
```

**Diagram sources**
- [package.json:17-38](file://backend/package.json#L17-L38)

**Section sources**
- [package.json:1-50](file://backend/package.json#L1-L50)

## Performance Considerations
- Queueing: Prefer Redis-backed BullMQ for high throughput; fallback to database jobs for reliability.
- Database: Use Knex migrations to maintain schema consistency; repair engine prevents runtime failures due to missing tables/columns.
- Logging: Keep activity logs minimal and asynchronous where possible to reduce latency.
- Static Assets: Serve immutable assets with long cache lifetimes; disable caching for index.html to avoid stale SPAs.
- Health Checks: Use the /health endpoint for load balancer probes.

## Troubleshooting Guide
- Database Connectivity
  - Confirm environment variables for database host, user, password, and name.
  - Verify migrations ran successfully and schema repair did not report failures.
- Authentication Failures
  - Ensure JWT secret is set and consistent across deployments.
  - Confirm Authorization header format: Bearer <token>.
- Queue Issues
  - Check Redis availability if using BullMQ; fallback to database jobs is automatic.
  - Inspect queue_fallback_jobs for stuck or failing entries.
- Socket.IO
  - Validate token presence in handshake auth; ensure server CORS allows connections.

**Section sources**
- [index.js:32-125](file://backend/src/index.js#L32-L125)
- [auth.js:14-20](file://backend/src/middleware/auth.js#L14-L20)
- [queueManager.js:16-51](file://backend/src/services/queueManager.js#L16-L51)
- [socketService.js:16-27](file://backend/src/services/socketService.js#L16-L27)

## Conclusion
The backend employs a clean, layered architecture with strong separation between presentation, application, persistence, and infrastructure concerns. It leverages Knex for database operations, BullMQ for background tasks, Socket.IO for real-time updates, and JWT for secure access. Robust startup routines, migration orchestration, and schema repair ensure operational resilience. The documented patterns enable maintainability, scalability, and straightforward extension.