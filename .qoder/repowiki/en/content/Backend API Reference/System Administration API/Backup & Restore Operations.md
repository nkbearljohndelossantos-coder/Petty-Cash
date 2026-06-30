# Backup & Restore Operations

<cite>
**Referenced Files in This Document**
- [backupController.js](file://backend/src/controllers/backupController.js)
- [backup.js](file://backend/src/routes/backup.js)
- [BackupRestore.jsx](file://frontend/src/pages/BackupRestore.jsx)
- [api.js](file://frontend/src/services/api.js)
- [knexfile.js](file://backend/knexfile.js)
- [scheduler.js](file://backend/src/services/scheduler.js)
- [index.js](file://backend/src/index.js)
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
This document describes the backup and restore system endpoints for the NKB Petty Cash System. It covers manual backup creation, restoration workflows, and operational controls. The system currently supports exporting the database to an Excel spreadsheet and importing a previously exported backup to restore data. The implementation includes role-based access control, transactional restoration, and basic integrity checks during restore operations.

## Project Structure
The backup and restore functionality spans backend controllers and routes, frontend UI components, and supporting configuration files:
- Backend controller handles export and restore operations
- Express routes define endpoint access and file upload constraints
- Frontend page provides user interface for initiating backups and restores
- Database configuration defines connection parameters for the MySQL database
- Scheduler module manages recurring tasks unrelated to backups but relevant to system maintenance

```mermaid
graph TB
subgraph "Frontend"
UI["BackupRestore.jsx"]
API["api.js"]
end
subgraph "Backend"
Routes["routes/backup.js"]
Controller["controllers/backupController.js"]
DBConfig["knexfile.js"]
Scheduler["services/scheduler.js"]
Bootstrap["src/index.js"]
end
UI --> API
API --> Routes
Routes --> Controller
Controller --> DBConfig
Scheduler -.-> Bootstrap
```

**Diagram sources**
- [backup.js:1-33](file://backend/src/routes/backup.js#L1-L33)
- [backupController.js:1-137](file://backend/src/controllers/backupController.js#L1-L137)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [scheduler.js:1-154](file://backend/src/services/scheduler.js#L1-L154)
- [index.js:60-99](file://backend/src/index.js#L60-L99)

**Section sources**
- [backup.js:1-33](file://backend/src/routes/backup.js#L1-L33)
- [backupController.js:1-137](file://backend/src/controllers/backupController.js#L1-L137)
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)
- [scheduler.js:1-154](file://backend/src/services/scheduler.js#L1-L154)
- [index.js:60-99](file://backend/src/index.js#L60-L99)

## Core Components
- Export endpoint: Generates a single Excel workbook containing all configured tables
- Import endpoint: Restores data from an uploaded Excel workbook using a transaction
- Role-based access control: Requires Super Admin privileges
- File upload handling: Accepts only .xlsx files via multer
- Transactional restore: Ensures atomicity during restoration

Key operational characteristics:
- Export creates a single workbook with worksheets named after database tables
- Restore clears existing data in dependency-aware order, then inserts data from the workbook
- Temporary file handling ensures cleanup after restore attempts

**Section sources**
- [backupController.js:6-56](file://backend/src/controllers/backupController.js#L6-L56)
- [backupController.js:58-136](file://backend/src/controllers/backupController.js#L58-L136)
- [backup.js:8-27](file://backend/src/routes/backup.js#L8-L27)
- [backup.js:29-30](file://backend/src/routes/backup.js#L29-L30)

## Architecture Overview
The backup and restore architecture follows a clear separation of concerns:
- Frontend triggers requests via the API service
- Express routes enforce authentication and authorization
- Controller performs database operations and file handling
- Database configuration defines connection parameters

```mermaid
sequenceDiagram
participant User as "Admin User"
participant UI as "BackupRestore.jsx"
participant API as "api.js"
participant Router as "routes/backup.js"
participant Ctrl as "controllers/backupController.js"
participant DB as "MySQL via Knex"
User->>UI : Click "Export Backup"
UI->>API : GET /backup/export
API->>Router : Route request
Router->>Ctrl : exportBackup()
Ctrl->>DB : Read tables data
Ctrl-->>Router : Excel buffer
Router-->>API : Excel file stream
API-->>UI : Blob download
User->>UI : Select .xlsx file and click "Restore"
UI->>API : POST /backup/import (multipart/form-data)
API->>Router : Route request
Router->>Ctrl : restoreBackup(file)
Ctrl->>DB : Begin transaction
Ctrl->>DB : Truncate tables (reverse order)
Ctrl->>DB : Insert data from workbook
Ctrl->>DB : Commit/Rollback
Ctrl-->>Router : Success/Failure response
Router-->>API : JSON result
API-->>UI : Status message
```

**Diagram sources**
- [BackupRestore.jsx:12-32](file://frontend/src/pages/BackupRestore.jsx#L12-L32)
- [BackupRestore.jsx:40-65](file://frontend/src/pages/BackupRestore.jsx#L40-L65)
- [api.js:1-29](file://frontend/src/services/api.js#L1-L29)
- [backup.js:29-30](file://backend/src/routes/backup.js#L29-L30)
- [backupController.js:6-56](file://backend/src/controllers/backupController.js#L6-L56)
- [backupController.js:58-136](file://backend/src/controllers/backupController.js#L58-L136)

## Detailed Component Analysis

### Export Endpoint
Purpose:
- Create a comprehensive backup of the system by exporting all relevant tables into a single Excel workbook

Behavior:
- Reads data from predefined tables
- Writes each table as a worksheet
- Streams the workbook as an Excel file attachment

Access control:
- Protected route requiring authentication and Super Admin authorization

Response:
- 200 OK with Excel file attachment on success
- 500 Internal Server Error with error message on failure

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "routes/backup.js"
participant Ctrl as "controllers/backupController.js"
participant DB as "MySQL via Knex"
Client->>Router : GET /backup/export
Router->>Ctrl : exportBackup()
Ctrl->>DB : SELECT * FROM tables
DB-->>Ctrl : Rows per table
Ctrl->>Ctrl : Build Excel workbook
Ctrl-->>Router : Buffer + headers
Router-->>Client : 200 OK + Excel file
```

**Diagram sources**
- [backup.js](file://backend/src/routes/backup.js#L29)
- [backupController.js:6-56](file://backend/src/controllers/backupController.js#L6-L56)

**Section sources**
- [backupController.js:6-56](file://backend/src/controllers/backupController.js#L6-L56)
- [backup.js](file://backend/src/routes/backup.js#L29)

### Import Endpoint
Purpose:
- Restore the system database from an uploaded Excel backup file

Behavior:
- Validates file type (.xlsx)
- Begins a database transaction
- Clears existing data in dependency-aware reverse order
- Inserts data from each worksheet into corresponding tables
- Commits on success, rolls back on error
- Cleans up temporary upload file

Access control:
- Protected route requiring authentication and Super Admin authorization

Response:
- 200 OK with success message on success
- 400 Bad Request if no file is provided
- 500 Internal Server Error with error message on failure

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "routes/backup.js"
participant Ctrl as "controllers/backupController.js"
participant DB as "MySQL via Knex"
Client->>Router : POST /backup/import (multipart/form-data)
Router->>Ctrl : restoreBackup(file)
alt No file provided
Ctrl-->>Router : 400 Bad Request
else File provided
Ctrl->>Ctrl : Validate .xlsx
Ctrl->>DB : Begin transaction
Ctrl->>DB : DELETE FROM tables (reverse order)
Ctrl->>DB : INSERT INTO tables from workbook
alt Success
Ctrl->>DB : Commit
Ctrl-->>Router : 200 OK
else Failure
Ctrl->>DB : Rollback
Ctrl-->>Router : 500 Error
end
Ctrl->>Ctrl : Cleanup temp file
end
Router-->>Client : JSON response
```

**Diagram sources**
- [backup.js:18-27](file://backend/src/routes/backup.js#L18-L27)
- [backup.js](file://backend/src/routes/backup.js#L30)
- [backupController.js:58-136](file://backend/src/controllers/backupController.js#L58-L136)

**Section sources**
- [backupController.js:58-136](file://backend/src/controllers/backupController.js#L58-L136)
- [backup.js:18-27](file://backend/src/routes/backup.js#L18-L27)
- [backup.js](file://backend/src/routes/backup.js#L30)

### Frontend Integration
The frontend provides:
- Export button that downloads a timestamped Excel file
- File selection for restore with confirmation modal
- Status messages for success and error scenarios
- Critical warning about destructive nature of restore

```mermaid
flowchart TD
Start(["Open Backup & Restore Page"]) --> Export["Click Export Button"]
Export --> CallAPI["Call GET /backup/export via API"]
CallAPI --> Download["Download Excel File"]
Start --> SelectFile["Select .xlsx File"]
SelectFile --> Confirm["Show Confirmation Modal"]
Confirm --> |Cancel| Start
Confirm --> |Confirm| Upload["POST /backup/import with FormData"]
Upload --> Status["Display Status Message"]
```

**Diagram sources**
- [BackupRestore.jsx:12-32](file://frontend/src/pages/BackupRestore.jsx#L12-L32)
- [BackupRestore.jsx:34-65](file://frontend/src/pages/BackupRestore.jsx#L34-L65)

**Section sources**
- [BackupRestore.jsx:12-32](file://frontend/src/pages/BackupRestore.jsx#L12-L32)
- [BackupRestore.jsx:34-65](file://frontend/src/pages/BackupRestore.jsx#L34-L65)

### Database Configuration
The system connects to a MySQL database using Knex with environment variables for credentials and connection details. Migration and seed directories are configured for schema management.

**Section sources**
- [knexfile.js:1-37](file://backend/knexfile.js#L1-L37)

### Scheduling Context
While backup scheduling is not implemented in the current code, the scheduler module demonstrates how recurring tasks are managed in the system. This provides context for potential future automation of backups.

**Section sources**
- [scheduler.js:1-154](file://backend/src/services/scheduler.js#L1-L154)

## Dependency Analysis
The backup system depends on:
- Express routes for request handling and file upload constraints
- Multer for secure file upload to a designated temporary directory
- ExcelJS for workbook creation and parsing
- Knex for database access and transaction management
- Authentication and authorization middleware for role enforcement

```mermaid
graph LR
Routes["routes/backup.js"] --> Multer["Multer"]
Routes --> Controller["controllers/backupController.js"]
Controller --> ExcelJS["ExcelJS"]
Controller --> Knex["Knex (MySQL)"]
Routes --> Auth["Auth Middleware"]
Frontend["BackupRestore.jsx"] --> API["api.js"]
API --> Routes
```

**Diagram sources**
- [backup.js:1-33](file://backend/src/routes/backup.js#L1-L33)
- [backupController.js:1-5](file://backend/src/controllers/backupController.js#L1-L5)
- [api.js:1-29](file://frontend/src/services/api.js#L1-L29)

**Section sources**
- [backup.js:1-33](file://backend/src/routes/backup.js#L1-L33)
- [backupController.js:1-5](file://backend/src/controllers/backupController.js#L1-L5)
- [api.js:1-29](file://frontend/src/services/api.js#L1-L29)

## Performance Considerations
- Export performance scales with the total number of rows across tables; consider limiting export scope for very large datasets
- Restore performance depends on insert volume and database write speed; the transactional approach ensures consistency but may lock tables during operation
- File upload size limits are enforced by multer; ensure client devices can handle large Excel files
- Network bandwidth affects export/download speeds; consider compressing data externally if needed

## Troubleshooting Guide
Common issues and resolutions:
- Access Denied: Ensure the requesting user has Super Admin role; endpoints are protected by authorization middleware
- Invalid File Type: Only .xlsx files are accepted; verify the uploaded file extension
- Restore Failed: Review server logs for database errors; the system automatically rolls back on failure and cleans up temporary files
- Empty Sheets: Export handles empty tables gracefully; if a table is empty, an empty worksheet may be included
- Large Data Sets: For very large exports/restores, monitor memory usage and database performance

Operational notes:
- Temporary files are stored in the uploads directory and cleaned up after restore attempts
- Transactional restore ensures data integrity; partial failures roll back all changes
- The restore process truncates tables in reverse dependency order to avoid foreign key conflicts

**Section sources**
- [backup.js:18-27](file://backend/src/routes/backup.js#L18-L27)
- [backupController.js:58-136](file://backend/src/controllers/backupController.js#L58-L136)

## Conclusion
The backup and restore system provides a straightforward mechanism for exporting and restoring the entire database state using Excel workbooks. It enforces role-based access control, uses transactions for reliable restoration, and includes basic integrity safeguards. While automated scheduling is not yet implemented, the existing architecture supports future enhancements such as scheduled exports and retention policies.