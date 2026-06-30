# Approval Workflow System

<cite>
**Referenced Files in This Document**
- [approvalController.js](file://backend/src/controllers/approvalController.js)
- [approvalService.js](file://backend/src/services/approvalService.js)
- [approval.js](file://backend/src/routes/approval.js)
- [ApprovalSettingsPanel.jsx](file://frontend/src/components/ApprovalSettingsPanel.jsx)
- [approvalSchemaRepair.js](file://backend/src/utils/approvalSchemaRepair.js)
- [20260611000000_add_liquidation_approval_workflow.js](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js)
- [analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [expenseController.js](file://backend/src/controllers/expenseController.js)
- [emailService.js](file://backend/src/services/emailService.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)
- [socketService.js](file://backend/src/services/socketService.js)
- [auth.js](file://backend/src/middleware/auth.js)
- [db.js](file://backend/src/config/db.js)
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
This document describes the multi-level approval workflow system for petty cash liquidations. It covers threshold-based approval detection, email-based approval processes, token-based security mechanisms, approval routing algorithms, escalation procedures, audit trail maintenance, and integration with expense management. It also documents the approval settings panel configuration, approver assignment, workflow customization, approval status tracking, notification triggers, analytics and reporting capabilities, workflow optimization, security considerations, approval history, and compliance requirements.

## Project Structure
The approval workflow spans backend controllers, services, database migrations, and frontend components. Controllers expose REST endpoints for approval settings, approver management, and token-based actions. Services encapsulate business logic for thresholds, routing, tokens, emails, notifications, and audit logging. Frontend provides an administrative panel to configure thresholds and manage approvers. Migrations define the schema for approvals, tokens, auditors, and default settings.

```mermaid
graph TB
subgraph "Frontend"
ASP["ApprovalSettingsPanel.jsx"]
end
subgraph "Backend"
R["routes/approval.js"]
C["controllers/approvalController.js"]
S["services/approvalService.js"]
E["services/emailService.js"]
N["services/notificationDispatcher.js"]
T["services/socketService.js"]
D["config/db.js"]
M["db/migrations/*_add_liquidation_approval_workflow.js"]
P["utils/approvalSchemaRepair.js"]
end
ASP --> R
R --> C
C --> S
S --> E
S --> N
S --> T
S --> D
S --> M
S --> P
```

**Diagram sources**
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)
- [emailService.js](file://backend/src/services/emailService.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)
- [socketService.js](file://backend/src/services/socketService.js)
- [db.js](file://backend/src/config/db.js)
- [20260611000000_add_liquidation_approval_workflow.js:1-179](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L1-L179)
- [approvalSchemaRepair.js:1-100](file://backend/src/utils/approvalSchemaRepair.js#L1-L100)
- [ApprovalSettingsPanel.jsx:1-252](file://frontend/src/components/ApprovalSettingsPanel.jsx#L1-L252)

**Section sources**
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)
- [20260611000000_add_liquidation_approval_workflow.js:1-179](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L1-L179)
- [approvalSchemaRepair.js:1-100](file://backend/src/utils/approvalSchemaRepair.js#L1-L100)
- [ApprovalSettingsPanel.jsx:1-252](file://frontend/src/components/ApprovalSettingsPanel.jsx#L1-L252)

## Core Components
- Approval controller: Exposes endpoints for settings retrieval/update, approver CRUD, token verification, and audit trail retrieval.
- Approval service: Implements threshold checks, approval routing, token generation and validation, email notifications, audit logging, and broadcast events.
- Routes: Defines public token-based endpoints and protected admin endpoints.
- Frontend settings panel: Allows administrators to configure approval threshold, enable/disable email approval, set primary approver email, and manage multi-level approvers.
- Schema and migrations: Define approval-related tables, default settings, and email templates.
- Utilities: Schema repair utility ensures compatibility across environments.

Key responsibilities:
- Threshold-based approval detection: Determines whether an expense requires approval based on configured threshold.
- Token-based security: Generates hashed tokens per approval level with expiry and single-use semantics.
- Email-based approval: Sends secure approve/decline links to designated approvers.
- Multi-level routing: Moves approvals across configured levels and escalates accordingly.
- Audit and compliance: Records all actions with actor identity, IP address, and timestamps.
- Notifications: Notifies requesters upon finalization via internal notifications and broadcasts.

**Section sources**
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [ApprovalSettingsPanel.jsx:1-252](file://frontend/src/components/ApprovalSettingsPanel.jsx#L1-L252)
- [20260611000000_add_liquidation_approval_workflow.js:1-179](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L1-L179)
- [approvalSchemaRepair.js:1-100](file://backend/src/utils/approvalSchemaRepair.js#L1-L100)

## Architecture Overview
The system integrates frontend configuration, backend processing, database persistence, and external systems for email delivery and real-time notifications.

```mermaid
sequenceDiagram
participant Admin as "Admin Panel"
participant Route as "Routes/approval.js"
participant Ctrl as "Controller/approvalController.js"
participant Svc as "Service/approvalService.js"
participant DB as "Database"
participant Mail as "EmailService"
participant Notify as "NotificationDispatcher"
participant Socket as "SocketService"
Admin->>Route : GET/PUT settings, GET/POST approvers
Route->>Ctrl : Invoke handler
Ctrl->>Svc : getApprovalSettings()/updateApprovalSettings()
Svc->>DB : Read/Write settings
DB-->>Svc : Settings/Approvers
Svc-->>Ctrl : Settings/Approvers
Ctrl-->>Admin : JSON response
Admin->>Route : POST /approval/approve/ : token or /approval/decline/ : token
Route->>Ctrl : verifyToken/processApproval/processDecline
Ctrl->>Svc : verifyToken/processApproval/processDecline
Svc->>DB : Validate token, update expense, insert audit
Svc->>Mail : sendApprovalEmail/send email templates
Svc->>Notify : dispatchNotification
Svc->>Socket : broadcast expense_updated/balance_updated
Svc-->>Ctrl : Result
Ctrl-->>Admin : JSON response
```

**Diagram sources**
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)
- [emailService.js](file://backend/src/services/emailService.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)
- [socketService.js](file://backend/src/services/socketService.js)

## Detailed Component Analysis

### Threshold-Based Approval Detection
Threshold detection evaluates whether an expense amount meets or exceeds the configured approval threshold. If so, the system initiates the approval workflow; otherwise, it records the creation event and proceeds without approval.

```mermaid
flowchart TD
Start(["Create Expense"]) --> CheckAmt["Compare Amount vs Threshold"]
CheckAmt --> |>= Threshold| Require["Requires Approval"]
CheckAmt --> |< Threshold| NoRequire["No Approval Needed"]
Require --> Init["Initiate Approval Workflow"]
Init --> Submit["Set Status=For Approval<br/>Record Audit 'submitted'"]
Submit --> Email["Send Approval Email"]
Email --> Next["Wait for Approver Action"]
NoRequire --> Record["Record Audit 'created'"]
Record --> End(["End"])
Next --> End
```

**Diagram sources**
- [approvalService.js:114-117](file://backend/src/services/approvalService.js#L114-L117)
- [approvalService.js:292-355](file://backend/src/services/approvalService.js#L292-L355)

**Section sources**
- [approvalService.js:114-117](file://backend/src/services/approvalService.js#L114-L117)
- [approvalService.js:292-355](file://backend/src/services/approvalService.js#L292-L355)

### Token-Based Security Mechanisms
Token-based security secures email-based approvals:
- Tokens are generated per approval level and stored as SHA-256 hashes.
- Each token has an expiration date and is single-use.
- Public endpoints verify tokens and process approvals or declines.

```mermaid
sequenceDiagram
participant System as "System"
participant Svc as "approvalService.js"
participant DB as "Database"
participant Approver as "Approver"
participant Requester as "Requester"
System->>Svc : createApprovalTokens(expenseId, level)
Svc->>DB : Insert hashed tokens with expiry
DB-->>Svc : Tokens created
Svc-->>Approver : Email with approve/decline links
Approver->>System : POST /approval/approve/ : token
System->>Svc : verifyToken/processApproval
Svc->>DB : Invalidate token, update expense, insert audit
Svc->>Requester : Notify requester (approved/liquidated)
Svc->>System : Broadcast balance_updated/expense_updated
```

**Diagram sources**
- [approvalService.js:223-250](file://backend/src/services/approvalService.js#L223-L250)
- [approvalService.js:387-425](file://backend/src/services/approvalService.js#L387-L425)
- [approvalService.js:427-509](file://backend/src/services/approvalService.js#L427-L509)
- [approvalService.js:511-555](file://backend/src/services/approvalService.js#L511-L555)

**Section sources**
- [approvalService.js:7-12](file://backend/src/services/approvalService.js#L7-L12)
- [approvalService.js:223-250](file://backend/src/services/approvalService.js#L223-L250)
- [approvalService.js:387-425](file://backend/src/services/approvalService.js#L387-L425)
- [approvalService.js:427-509](file://backend/src/services/approvalService.js#L427-L509)
- [approvalService.js:511-555](file://backend/src/services/approvalService.js#L511-L555)

### Approval Routing and Escalation Procedures
Routing follows approval levels:
- If the current level is less than total levels, escalate to the next level.
- If at the final level, finalize the expense (Liquidated or Approved depending on context).
- Broadcast updates to connected clients and notify requesters.

```mermaid
flowchart TD
Enter(["Approve at Level N"]) --> CheckLast{"Is Current Level Final?"}
CheckLast --> |No| NextLevel["Increment Level<br/>Update Expense"]
NextLevel --> SendEmail["Send Approval Email to Next Level"]
SendEmail --> BroadcastNext["Broadcast expense_updated(level+1)"]
BroadcastNext --> End(["End"])
CheckLast --> |Yes| Finalize["Set Status=Final<br/>Update Expense"]
Finalize --> Notify["Notify Requester<br/>Broadcast balance_updated/expense_updated"]
Notify --> End
```

**Diagram sources**
- [approvalService.js:458-475](file://backend/src/services/approvalService.js#L458-L475)
- [approvalService.js:477-508](file://backend/src/services/approvalService.js#L477-L508)

**Section sources**
- [approvalService.js:292-327](file://backend/src/services/approvalService.js#L292-L327)
- [approvalService.js:458-508](file://backend/src/services/approvalService.js#L458-L508)

### Audit Trail Maintenance
The system maintains a comprehensive audit trail capturing creation, submission, approval, and decline actions with actor identity, IP address, and approval level.

```mermaid
erDiagram
LIQUIDATION_APPROVAL_AUDIT {
int id PK
int expense_id FK
string action
string actor_type
int actor_user_id
string actor_email
string actor_name
string ip_address
text decline_reason
int approval_level
timestamp created_at
}
EXPENSES {
int id PK
varchar status
int current_approval_level
int submitted_by
timestamp submitted_at
string approval_context
}
LIQUIDATION_APPROVAL_AUDIT }o--|| EXPENSES : "records actions for"
```

**Diagram sources**
- [20260611000000_add_liquidation_approval_workflow.js:47-76](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L47-L76)
- [approvalService.js:119-143](file://backend/src/services/approvalService.js#L119-L143)
- [approvalService.js:161-214](file://backend/src/services/approvalService.js#L161-L214)

**Section sources**
- [approvalService.js:119-143](file://backend/src/services/approvalService.js#L119-L143)
- [approvalService.js:161-214](file://backend/src/services/approvalService.js#L161-L214)
- [20260611000000_add_liquidation_approval_workflow.js:47-76](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L47-L76)

### Approval Settings Panel Configuration
The frontend settings panel allows administrators to:
- Set the liquidation approval threshold.
- Enable/disable email-based approval.
- Configure a primary approver email.
- Manage additional approvers for multi-level approval chains.

```mermaid
classDiagram
class ApprovalSettingsPanel {
+state settings
+state approvers
+fetchData()
+handleSave()
+handleAddApprover()
+handleDeleteApprover()
}
class API {
+GET /approval/settings
+PUT /approval/settings
+GET /approval/approvers
+POST /approval/approvers
+DELETE /approval/approvers/ : id
}
ApprovalSettingsPanel --> API : "consumes"
```

**Diagram sources**
- [ApprovalSettingsPanel.jsx:1-252](file://frontend/src/components/ApprovalSettingsPanel.jsx#L1-L252)
- [approval.js:22-33](file://backend/src/routes/approval.js#L22-L33)

**Section sources**
- [ApprovalSettingsPanel.jsx:1-252](file://frontend/src/components/ApprovalSettingsPanel.jsx#L1-L252)
- [approval.js:22-33](file://backend/src/routes/approval.js#L22-L33)

### Integration with Expense Management
The approval workflow integrates with expense management by:
- Updating expense status to "For Approval" during initiation.
- Recording submission metadata (submitter, timestamp, context).
- Broadcasting updates for real-time UI refresh.
- Supporting both liquidation and general expense contexts.

```mermaid
sequenceDiagram
participant Expense as "ExpenseController"
participant Svc as "approvalService.js"
participant DB as "Database"
participant Socket as "SocketService"
Expense->>Svc : createExpenseWithApprovalCheck(amount, userId, ip)
Svc->>Svc : shouldRequireApproval()
alt Requires Approval
Svc->>DB : Update status=For Approval
Svc->>DB : Insert audit 'created/submitted'
Svc->>Socket : broadcast('expense_updated')
else No Approval
Svc->>DB : Insert audit 'created'
end
```

**Diagram sources**
- [approvalService.js:329-355](file://backend/src/services/approvalService.js#L329-L355)
- [approvalService.js:292-327](file://backend/src/services/approvalService.js#L292-L327)

**Section sources**
- [approvalService.js:292-355](file://backend/src/services/approvalService.js#L292-L355)

### Notification Triggers and Real-Time Updates
Notifications are triggered upon finalization:
- Requester receives internal notifications and email templates.
- Socket broadcasts are emitted for balance updates and expense status changes.

```mermaid
sequenceDiagram
participant Svc as "approvalService.js"
participant Notify as "notificationDispatcher.js"
participant Socket as "socketService.js"
participant Requester as "Requester"
Svc->>Notify : dispatchNotification (final approved)
Svc->>Notify : dispatchNotification (final declined)
Svc->>Socket : broadcast('balance_updated' or 'expense_updated')
Notify-->>Requester : Internal notification
```

**Diagram sources**
- [approvalService.js:357-385](file://backend/src/services/approvalService.js#L357-L385)
- [approvalService.js:486-504](file://backend/src/services/approvalService.js#L486-L504)
- [approvalService.js:550-554](file://backend/src/services/approvalService.js#L550-L554)

**Section sources**
- [approvalService.js:357-385](file://backend/src/services/approvalService.js#L357-L385)
- [approvalService.js:486-504](file://backend/src/services/approvalService.js#L486-L504)
- [approvalService.js:550-554](file://backend/src/services/approvalService.js#L550-L554)

### Approval Analytics and Reporting
Analytics and reporting can leverage:
- Expense activity logs and approval audits.
- Approval metrics such as approval rates, average processing time, and escalation frequency.
- Integration points with analytics controllers for dashboard views.

Note: Specific analytics endpoints and report generation logic are located in dedicated controllers and are not included in the referenced files here.

**Section sources**
- [analyticsController.js](file://backend/src/controllers/analyticsController.js)
- [approvalService.js:161-214](file://backend/src/services/approvalService.js#L161-L214)

### Workflow Optimization
Optimization opportunities include:
- Parallelization of email sending and notification dispatch.
- Batch token invalidation and cleanup jobs.
- Index tuning for audit and token tables.
- Caching frequently accessed settings.

[No sources needed since this section provides general guidance]

## Dependency Analysis
The approval system exhibits clear separation of concerns:
- Routes depend on controllers.
- Controllers depend on services.
- Services depend on database, email, notifications, and sockets.
- Migrations and repair utilities maintain schema consistency.

```mermaid
graph LR
R["routes/approval.js"] --> C["controllers/approvalController.js"]
C --> S["services/approvalService.js"]
S --> D["config/db.js"]
S --> E["services/emailService.js"]
S --> N["services/notificationDispatcher.js"]
S --> T["services/socketService.js"]
S --> M["db/migrations/*"]
S --> P["utils/approvalSchemaRepair.js"]
```

**Diagram sources**
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)
- [db.js](file://backend/src/config/db.js)
- [20260611000000_add_liquidation_approval_workflow.js:1-179](file://backend/src/db/migrations/20260611000000_add_liquidation_approval_workflow.js#L1-L179)
- [approvalSchemaRepair.js:1-100](file://backend/src/utils/approvalSchemaRepair.js#L1-L100)

**Section sources**
- [approval.js:1-36](file://backend/src/routes/approval.js#L1-L36)
- [approvalController.js:1-108](file://backend/src/controllers/approvalController.js#L1-L108)
- [approvalService.js:1-590](file://backend/src/services/approvalService.js#L1-L590)

## Performance Considerations
- Token hashing and database indexing reduce lookup overhead.
- Single-use tokens prevent replay attacks and reduce concurrent processing complexity.
- Broadcasting reduces polling and improves responsiveness.
- Consider background workers for heavy tasks like email sending and report generation.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid or expired token: Verify token validity and expiration; ensure proper token hashing and single-use enforcement.
- Email not sent: Confirm email service configuration and template availability; check logs for errors.
- Approver not receiving emails: Validate approver list and primary email settings; confirm active status and correct level assignment.
- Audit trail missing: Ensure audit table exists and schema repair utility ran successfully.
- Permission denied: Verify authentication middleware and authorization roles for admin endpoints.

**Section sources**
- [approvalService.js:387-425](file://backend/src/services/approvalService.js#L387-L425)
- [approvalService.js:511-555](file://backend/src/services/approvalService.js#L511-L555)
- [approvalSchemaRepair.js:1-100](file://backend/src/utils/approvalSchemaRepair.js#L1-L100)
- [auth.js](file://backend/src/middleware/auth.js)

## Conclusion
The approval workflow system provides a robust, configurable, and secure mechanism for managing petty cash liquidations. It leverages threshold-based detection, token-based security, multi-level routing, comprehensive auditing, and integrated notifications. Administrators can tailor thresholds and approvers, while requesters receive timely updates. The modular architecture supports scalability, maintainability, and compliance through detailed audit trails and standardized schemas.

## Appendices
- Compliance: Maintain audit logs, enforce token expiry, and ensure approver identity tracking for regulatory adherence.
- Security: Use hashed tokens, limit token lifetimes, sanitize inputs, and restrict admin endpoints with role-based authorization.
- Monitoring: Track approval latency, escalation rates, and requester satisfaction via analytics integrations.

[No sources needed since this section summarizes without analyzing specific files]