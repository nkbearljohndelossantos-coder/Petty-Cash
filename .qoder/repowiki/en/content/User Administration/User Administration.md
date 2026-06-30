# User Administration

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [USER_MANUAL.md](file://USER_MANUAL.md)
- [deployment_guide.md](file://deployment_guide.md)
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260512000000_initial_schema.js](file://backend/src/db/migrations/20260512000000_initial_schema.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/services/approvalService.js](file://backend/src/services/approvalService.js)
- [backend/src/controllers/approvalController.js](file://backend/src/controllers/approvalController.js)
- [backend/src/controllers/categoryController.js](file://backend/src/controllers/categoryController.js)
- [backend/src/controllers/departmentController.js](file://backend/src/controllers/departmentController.js)
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)
- [backend/knexfile.js](file://backend/knexfile.js)
- [frontend/src/pages/Users.jsx](file://frontend/src/pages/Users.jsx)
- [frontend/src/pages/Categories.jsx](file://frontend/src/pages/Categories.jsx)
- [frontend/src/pages/Departments.jsx](file://frontend/src/pages/Departments.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)
- [frontend/src/services/api.js](file://frontend/src/services/api.js)
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
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive user administration documentation for the petty cash management system. It covers user account lifecycle management, role configuration, and organizational structure. It also documents role-based access control, permissions, security policies, department and category management, reporting structures, user provisioning, bulk operations, import/export capabilities, user analytics and activity monitoring, compliance reporting, and integrations with approval workflows and expense management systems.

## Project Structure
The system comprises a backend built with Node.js and a frontend built with React. The backend exposes REST endpoints for user management, approvals, categories, departments, analytics, logs, and other administrative functions. The frontend provides user-facing pages for managing users, categories, departments, reports, analytics, and logs. Database migrations define the schema and evolve the system over time.

```mermaid
graph TB
subgraph "Frontend"
FE_Users["Users Page"]
FE_Categories["Categories Page"]
FE_Departments["Departments Page"]
FE_Analytics["Analytics Page"]
FE_Reports["Reports Page"]
FE_Logs["Logs Page"]
FE_API["API Service"]
end
subgraph "Backend"
BE_Routes["Routes Layer"]
BE_Controllers["Controllers"]
BE_Services["Services"]
BE_DB[("Database")]
end
FE_Users --> FE_API
FE_Categories --> FE_API
FE_Departments --> FE_API
FE_Analytics --> FE_API
FE_Reports --> FE_API
FE_Logs --> FE_API
FE_API --> BE_Routes
BE_Routes --> BE_Controllers
BE_Controllers --> BE_Services
BE_Services --> BE_DB
```

**Section sources**
- [README.md](file://README.md)
- [USER_MANUAL.md](file://USER_MANUAL.md)

## Core Components
- User Management: Endpoints and controllers for creating, updating, deactivating, and provisioning users.
- Role-Based Access Control (RBAC): String-based roles and middleware enforcement for secure access.
- Organizational Structure: Departments and categories as hierarchical entities supporting reporting and categorization.
- Approvals and Expense Workflows: Liquidation approval workflow integrated with user roles and permissions.
- Analytics and Compliance: Activity monitoring, logs, and reporting for compliance and auditing.
- Provisioning and Bulk Operations: Seed data and database initialization utilities for onboarding new environments.
- Import/Export: Frontend utilities for exporting data to CSV and related reporting pages.

**Section sources**
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)
- [frontend/src/pages/Users.jsx](file://frontend/src/pages/Users.jsx)
- [frontend/src/pages/Categories.jsx](file://frontend/src/pages/Categories.jsx)
- [frontend/src/pages/Departments.jsx](file://frontend/src/pages/Departments.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)
- [frontend/src/services/api.js](file://frontend/src/services/api.js)

## Architecture Overview
The user administration architecture follows a layered pattern:
- Presentation Layer: React pages for user, categories, departments, analytics, reports, and logs.
- API Layer: Express routes delegating to controllers.
- Business Logic Layer: Controllers implementing domain-specific logic; services encapsulating reusable operations.
- Persistence Layer: Knex.js migrations and seed data define schema and initial datasets.

```mermaid
graph TB
UI["React Pages<br/>Users, Categories, Departments, Analytics, Reports, Logs"]
API["Express Routes"]
CTRL["Controllers"]
SVC["Services"]
DBMIG["Knex Migrations & Seeds"]
UI --> API
API --> CTRL
CTRL --> SVC
SVC --> DBMIG
```

**Diagram sources**
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)
- [frontend/src/pages/Users.jsx](file://frontend/src/pages/Users.jsx)
- [frontend/src/pages/Categories.jsx](file://frontend/src/pages/Categories.jsx)
- [frontend/src/pages/Departments.jsx](file://frontend/src/pages/Departments.jsx)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)

## Detailed Component Analysis

### User Account Lifecycle
- Creation: Endpoint accepts user data and persists validated records.
- Modification: Endpoint updates user attributes with validation and audit logging.
- Deactivation: Endpoint toggles active status and revokes access tokens.
- Provisioning: Seed data initializes admin and sample users; database initialization script supports clean deployments.
- Bulk Operations: Seed files provide sample datasets for testing and onboarding.

```mermaid
sequenceDiagram
participant Client as "Admin UI"
participant Route as "Users Route"
participant Ctrl as "Auth Controller"
participant DB as "Database"
Client->>Route : "POST /api/users"
Route->>Ctrl : "createUser(payload)"
Ctrl->>DB : "insert user record"
DB-->>Ctrl : "created user"
Ctrl-->>Route : "user object"
Route-->>Client : "201 Created"
Client->>Route : "PUT /api/users/ : id"
Route->>Ctrl : "updateUser(id, payload)"
Ctrl->>DB : "update user record"
DB-->>Ctrl : "updated user"
Ctrl-->>Route : "user object"
Route-->>Client : "200 OK"
Client->>Route : "DELETE /api/users/ : id"
Route->>Ctrl : "deactivateUser(id)"
Ctrl->>DB : "set inactive flag"
DB-->>Ctrl : "success"
Ctrl-->>Route : "status"
Route-->>Client : "204 No Content"
```

**Diagram sources**
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)

**Section sources**
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)

### Role-Based Access Control (RBAC)
- Roles are stored as strings in the database, enabling flexible role definitions.
- Authentication middleware enforces protected routes and validates tokens.
- Controllers enforce role checks for sensitive operations (e.g., user management, approvals).

```mermaid
flowchart TD
Start(["Request Received"]) --> VerifyToken["Verify JWT Token"]
VerifyToken --> TokenValid{"Token Valid?"}
TokenValid --> |No| Forbidden["401 Unauthorized"]
TokenValid --> |Yes| LoadUser["Load User with Role"]
LoadUser --> CheckRole["Check Required Role(s)"]
CheckRole --> HasAccess{"Has Sufficient Role?"}
HasAccess --> |No| Forbidden
HasAccess --> |Yes| Proceed["Proceed to Controller"]
Proceed --> End(["Response Sent"])
Forbidden --> End
```

**Diagram sources**
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)

**Section sources**
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)

### Organizational Structure: Departments and Categories
- Departments: Hierarchical units used for reporting and budget allocation.
- Categories: Expense classification system supporting categorization and analytics.
- Both resources support CRUD operations via dedicated controllers and routes.

```mermaid
classDiagram
class Department {
+uuid id
+string name
+uuid parent_id
+boolean is_active
+datetime created_at
+datetime updated_at
}
class Category {
+uuid id
+string name
+uuid parent_id
+boolean is_active
+datetime created_at
+datetime updated_at
}
class DepartmentController {
+createDepartment(data)
+updateDepartment(id, data)
+deleteDepartment(id)
+listDepartments(query)
}
class CategoryController {
+createCategory(data)
+updateCategory(id, data)
+deleteCategory(id)
+listCategories(query)
}
DepartmentController --> Department : "manages"
CategoryController --> Category : "manages"
```

**Diagram sources**
- [backend/src/controllers/departmentController.js](file://backend/src/controllers/departmentController.js)
- [backend/src/controllers/categoryController.js](file://backend/src/controllers/categoryController.js)

**Section sources**
- [backend/src/controllers/departmentController.js](file://backend/src/controllers/departmentController.js)
- [backend/src/controllers/categoryController.js](file://backend/src/controllers/categoryController.js)

### Approvals and Expense Workflows
- Liquidation approval workflow integrates with user roles to route requests to approvers.
- Approval service coordinates state transitions and notifications.
- Approval controller handles actions (approve/reject) and updates related expense records.

```mermaid
sequenceDiagram
participant User as "Submitter"
participant Exp as "Expense Controller"
participant AppSvc as "Approval Service"
participant AppCtrl as "Approval Controller"
participant DB as "Database"
User->>Exp : "Submit expense for liquidation"
Exp->>AppSvc : "createApprovalWorkflow(expenseId)"
AppSvc->>DB : "insert approval records"
DB-->>AppSvc : "workflow created"
AppSvc-->>Exp : "workflow ready"
Exp-->>User : "pending approval"
Approver->>AppCtrl : "Approve/Reject"
AppCtrl->>AppSvc : "processApproval(action)"
AppSvc->>DB : "update workflow and expense status"
DB-->>AppSvc : "updated"
AppSvc-->>AppCtrl : "result"
AppCtrl-->>Approver : "acknowledged"
```

**Diagram sources**
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/services/approvalService.js](file://backend/src/services/approvalService.js)
- [backend/src/controllers/approvalController.js](file://backend/src/controllers/approvalController.js)

**Section sources**
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/services/approvalService.js](file://backend/src/services/approvalService.js)
- [backend/src/controllers/approvalController.js](file://backend/src/controllers/approvalController.js)

### User Analytics, Activity Monitoring, and Compliance Reporting
- Analytics controller aggregates metrics for user activity and system usage.
- Logs controller provides audit trails and event logs for compliance.
- Reports page surfaces compliance-ready summaries and trends.

```mermaid
flowchart TD
Collect["Collect User Actions"] --> Store["Store Events in Logs"]
Store --> Aggregate["Aggregate Metrics"]
Aggregate --> Reports["Generate Compliance Reports"]
Reports --> Export["Export Reports"]
Export --> Distribute["Distribute to Stakeholders"]
```

**Diagram sources**
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)

**Section sources**
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)

### Import/Export Capabilities
- Frontend export utilities enable CSV exports for categories, departments, and analytics data.
- Reports and logs pages integrate with export functions to produce compliance artifacts.

```mermaid
flowchart TD
Data["Data Source"] --> ExportUtil["Export Utility"]
ExportUtil --> CSV["CSV File"]
CSV --> Download["Download"]
```

**Diagram sources**
- [frontend/src/utils/exportUtils.js](file://frontend/src/utils/exportUtils.js)
- [frontend/src/pages/Categories.jsx](file://frontend/src/pages/Categories.jsx)
- [frontend/src/pages/Departments.jsx](file://frontend/src/pages/Departments.jsx)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)

**Section sources**
- [frontend/src/utils/exportUtils.js](file://frontend/src/utils/exportUtils.js)
- [frontend/src/pages/Categories.jsx](file://frontend/src/pages/Categories.jsx)
- [frontend/src/pages/Departments.jsx](file://frontend/src/pages/Departments.jsx)
- [frontend/src/pages/Analytics.jsx](file://frontend/src/pages/Analytics.jsx)
- [frontend/src/pages/Reports.jsx](file://frontend/src/pages/Reports.jsx)
- [frontend/src/pages/Logs.jsx](file://frontend/src/pages/Logs.jsx)

### Database Schema and Initialization
- Initial schema defines core entities including users, departments, categories, and related tables.
- Subsequent migrations evolve the schema to support approvals, roles, and additional features.
- Database initialization script and seed files support clean deployments and onboarding.

```mermaid
erDiagram
USERS {
uuid id PK
string email UK
string username UK
string role
boolean is_active
timestamp created_at
timestamp updated_at
}
DEPARTMENTS {
uuid id PK
string name
uuid parent_id FK
boolean is_active
timestamp created_at
timestamp updated_at
}
CATEGORIES {
uuid id PK
string name
uuid parent_id FK
boolean is_active
timestamp created_at
timestamp updated_at
}
APPROVAL_WORKFLOW {
uuid id PK
uuid expense_id FK
string status
json approvers
timestamp created_at
timestamp updated_at
}
USERS ||--o{ APPROVAL_WORKFLOW : participates_in
DEPARTMENTS ||--o{ USERS : belongs_to
CATEGORIES ||--o{ APPROVAL_WORKFLOW : categorizes
```

**Diagram sources**
- [backend/src/db/migrations/20260512000000_initial_schema.js](file://backend/src/db/migrations/20260512000000_initial_schema.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)

**Section sources**
- [backend/src/db/migrations/20260512000000_initial_schema.js](file://backend/src/db/migrations/20260512000000_initial_schema.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [backend/src/utils/create_db.js](file://backend/src/utils/create_db.js)
- [backend/knexfile.js](file://backend/knexfile.js)

## Dependency Analysis
- Routes depend on controllers for business logic.
- Controllers depend on services for reusable operations.
- Services depend on database migrations and seed data for persistence.
- Frontend pages depend on the API service for data operations.

```mermaid
graph LR
FE_API["frontend/src/services/api.js"] --> BE_ROUTES["backend/src/routes/*"]
BE_ROUTES --> BE_CTRL["backend/src/controllers/*"]
BE_CTRL --> BE_SRV["backend/src/services/*"]
BE_SRV --> BE_DB["backend/src/db/migrations/*"]
```

**Diagram sources**
- [frontend/src/services/api.js](file://frontend/src/services/api.js)
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)

**Section sources**
- [frontend/src/services/api.js](file://frontend/src/services/api.js)
- [backend/src/routes/users.js](file://backend/src/routes/users.js)
- [backend/src/controllers/authController.js](file://backend/src/controllers/authController.js)
- [backend/src/controllers/analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [backend/src/controllers/logController.js](file://backend/src/controllers/logController.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)

## Performance Considerations
- Use pagination and filtering in list endpoints to limit response sizes.
- Index frequently queried columns (e.g., user email, department parent_id, category parent_id).
- Batch operations for bulk provisioning to reduce round trips.
- Cache non-sensitive metadata (e.g., department and category lists) to improve UI responsiveness.
- Monitor approval workflow throughput and scale workers accordingly.

## Troubleshooting Guide
- Authentication failures: Verify JWT token validity and role claims; check middleware enforcement.
- Database connectivity: Confirm Knex configuration and migration status; ensure seeds are applied after migrations.
- Approval workflow errors: Inspect workflow state transitions and approver assignments; validate permissions.
- Export issues: Ensure export utilities are invoked with correct data sources and file formats.

**Section sources**
- [backend/src/middleware/auth.js](file://backend/src/middleware/auth.js)
- [backend/knexfile.js](file://backend/knexfile.js)
- [backend/src/db/migrations/20260519120000_alter_user_role_to_string.js](file://backend/src/db/migrations/20260519120000_alter_user_role_to_string.js)
- [backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [frontend/src/utils/exportUtils.js](file://frontend/src/utils/exportUtils.js)

## Conclusion
The user administration system provides a robust foundation for managing users, enforcing RBAC, organizing departments and categories, and integrating approvals with expense workflows. Analytics, logs, and reporting support compliance needs, while import/export capabilities streamline operational tasks. The layered architecture ensures maintainability and scalability for future enhancements.

## Appendices
- Deployment guide outlines environment setup, migrations, and seed data application.
- User manual provides operational guidance for administrators and end users.

**Section sources**
- [deployment_guide.md](file://deployment_guide.md)
- [USER_MANUAL.md](file://USER_MANUAL.md)