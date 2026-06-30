# Real-Time Communication API

<cite>
**Referenced Files in This Document**
- [socketService.js](file://backend/src/services/socketService.js)
- [SocketContext.jsx](file://frontend/src/context/SocketContext.jsx)
- [sender.html](file://frontend/public/sender.html)
- [index.js](file://backend/src/index.js)
- [package.json](file://backend/package.json)
- [notificationCenterController.js](file://backend/src/controllers/notificationCenterController.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)
- [queueManager.js](file://backend/src/services/queueManager.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [WebSocket Connection Management](#websocket-connection-management)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Message Formats and Event Types](#message-formats-and-event-types)
5. [Notification Broadcasting](#notification-broadcasting)
6. [Live Dashboard Updates](#live-dashboard-updates)
7. [Subscription Management](#subscription-management)
8. [Reconnection Strategies](#reconnection-strategies)
9. [Message Queuing for Offline Clients](#message-queuing-for-offline-clients)
10. [Real-World Examples](#real-world-examples)
11. [Implementation Details](#implementation-details)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Conclusion](#conclusion)

## Introduction

The Real-Time Communication API provides WebSocket-based real-time functionality for the Petty Cash management system. This API enables live updates for expense status changes, approval notifications, system alerts, and dashboard synchronization. Built on Socket.IO with JWT authentication, it supports both authenticated user connections and guest connections with flexible reconnection capabilities.

The system facilitates immediate notification delivery, real-time dashboard updates, and seamless user experience through persistent WebSocket connections with intelligent fallback mechanisms.

## WebSocket Connection Management

### Connection Establishment

The WebSocket server initializes with configurable CORS policies and supports both polling and WebSocket transports for maximum compatibility across different network environments.

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant SocketIO as "Socket.IO Server"
participant Auth as "JWT Middleware"
participant UserManager as "Connection Manager"
Client->>SocketIO : Connect with optional token
SocketIO->>Auth : Verify JWT token
Auth-->>SocketIO : User ID or guest status
SocketIO->>UserManager : Register connection
SocketIO-->>Client : Connection established
Note over Client,SocketIO : Supports both authenticated and guest connections
```

**Diagram sources**
- [socketService.js:7-27](file://backend/src/services/socketService.js#L7-L27)
- [SocketContext.jsx:210-219](file://frontend/src/context/SocketContext.jsx#L210-L219)

### Connection Lifecycle

The connection lifecycle manages user associations, socket cleanup, and graceful disconnection handling with automatic resource management.

```mermaid
flowchart TD
Start([Connection Request]) --> AuthCheck["JWT Token Validation"]
AuthCheck --> Authenticated{"Authenticated?"}
Authenticated --> |Yes| RegisterUser["Register User Connection<br/>Map: userId → socketId"]
Authenticated --> |No| GuestConnect["Guest Connection<br/>Anonymous Access"]
RegisterUser --> Active["Active Connection"]
GuestConnect --> Active
Active --> Disconnect["Client Disconnect"]
Disconnect --> Cleanup["Remove from userSockets Map"]
Cleanup --> End([Connection Closed])
```

**Diagram sources**
- [socketService.js:29-71](file://backend/src/services/socketService.js#L29-L71)

**Section sources**
- [socketService.js:1-101](file://backend/src/services/socketService.js#L1-L101)
- [SocketContext.jsx:210-219](file://frontend/src/context/SocketContext.jsx#L210-L219)

## Authentication and Authorization

### JWT-Based Authentication

The system implements flexible JWT authentication that doesn't block connections but associates authenticated users with their sockets for targeted messaging.

```mermaid
classDiagram
class SocketMiddleware {
+verifyToken(token) boolean
+extractUserId(decoded) string
+setSocketUserId(userId) void
}
class UserSocketRegistry {
+userSockets Map~userId, Set~socketId~~
+register(userId, socketId) void
+unregister(userId, socketId) void
+getUserSockets(userId) Set~socketId~
}
class SocketService {
+initSocket(server) Server
+sendToUser(userId, event, data) boolean
+broadcast(event, data) boolean
}
SocketService --> UserSocketRegistry : "manages"
SocketMiddleware --> SocketService : "authenticates"
```

**Diagram sources**
- [socketService.js:15-27](file://backend/src/services/socketService.js#L15-L27)
- [socketService.js:5-6](file://backend/src/services/socketService.js#L5-L6)

### Authentication Flow

```mermaid
sequenceDiagram
participant Client as "Client"
participant Server as "Socket Server"
participant JWT as "JWT Service"
participant Registry as "User Registry"
Client->>Server : Connect with token
Server->>JWT : Verify token
JWT-->>Server : Decoded payload or error
alt Valid Token
Server->>Registry : Associate socket with userId
Registry-->>Server : Success
Server-->>Client : Authenticated connection
else Invalid Token
Server-->>Client : Guest connection (no user association)
end
```

**Diagram sources**
- [socketService.js:16-26](file://backend/src/services/socketService.js#L16-L26)

**Section sources**
- [socketService.js:15-27](file://backend/src/services/socketService.js#L15-L27)

## Message Formats and Event Types

### Core Events

The system defines standardized event types for different notification categories and user interactions:

| Event Name | Purpose | Data Structure | Trigger |
|------------|---------|----------------|---------|
| `new_notification` | Primary notification event | Normalized notification object | Backend services |
| `receiveNotification` | Custom notification handler | Custom notification data | Frontend example |
| `connect_error` | Connection error handling | Error details | Socket.IO errors |
| `disconnect` | Connection termination | Disconnection info | Client/server disconnect |

### Notification Data Model

```mermaid
erDiagram
NOTIFICATION {
string id PK
string title
string message
string type
string priority
string category
boolean acknowledged
boolean archived
datetime created_at
string user_id FK
}
USER {
string id PK
string username
string email
string role
}
USER ||--o{ NOTIFICATION : receives
```

**Diagram sources**
- [socketService.js:50-60](file://backend/src/services/socketService.js#L50-L60)

**Section sources**
- [socketService.js:42-61](file://backend/src/services/socketService.js#L42-L61)

## Notification Broadcasting

### Broadcast Mechanisms

The notification system supports two primary broadcasting approaches: targeted user notifications and global broadcasts.

```mermaid
flowchart TD
MessageArrival["Notification Message"] --> TypeCheck{"Broadcast Type"}
TypeCheck --> |Targeted| TargetedBroadcast["sendToUser(userId, event, data)"]
TypeCheck --> |Global| GlobalBroadcast["broadcast(event, data)"]
TypeCheck --> |Custom| CustomHandler["Custom Event Handler"]
TargetedBroadcast --> UserLookup["Lookup userSockets Map"]
UserLookup --> SocketEmit["Emit to specific socket(s)"]
GlobalBroadcast --> AllClients["Emit to all connected clients"]
CustomHandler --> NormalizeData["Normalize notification data"]
NormalizeData --> EmitBoth["Emit both receiveNotification<br/>and new_notification"]
```

**Diagram sources**
- [socketService.js:77-94](file://backend/src/services/socketService.js#L77-L94)
- [socketService.js:42-61](file://backend/src/services/socketService.js#L42-L61)

### Event Processing Pipeline

```mermaid
sequenceDiagram
participant Service as "Backend Service"
participant Socket as "Socket Service"
participant Client as "Connected Client"
Service->>Socket : sendToUser(userId, 'new_notification', data)
Socket->>Socket : Lookup userSockets Map
Socket->>Client : Emit 'new_notification' event
Client->>Client : Update local notification state
Client->>Client : Increment unread count
Client->>Client : Play notification sound (if enabled)
```

**Diagram sources**
- [socketService.js:77-86](file://backend/src/services/socketService.js#L77-L86)
- [SocketContext.jsx:225-236](file://frontend/src/context/SocketContext.jsx#L225-L236)

**Section sources**
- [socketService.js:42-94](file://backend/src/services/socketService.js#L42-L94)

## Live Dashboard Updates

### Dashboard Synchronization

The dashboard maintains real-time synchronization through WebSocket events and periodic polling fallback mechanisms.

```mermaid
sequenceDiagram
participant Dashboard as "Dashboard Component"
participant Socket as "Socket Service"
participant Polling as "Polling Fallback"
participant API as "Notification API"
Dashboard->>Socket : Subscribe to 'new_notification'
Socket-->>Dashboard : Real-time notifications
Dashboard->>Polling : Setup 30-second polling
Polling->>API : GET /api/notifications/unread
API-->>Polling : Unread notification count
Polling-->>Dashboard : Update unread count
Note over Dashboard,Socket : Primary : WebSocket<br/>Fallback : Polling every 30 seconds
```

**Diagram sources**
- [SocketContext.jsx:195-207](file://frontend/src/context/SocketContext.jsx#L195-L207)
- [SocketContext.jsx:225-236](file://frontend/src/context/SocketContext.jsx#L225-L236)

### Critical Alert Management

The system implements sophisticated critical alert handling with audio feedback and visual indicators.

```mermaid
flowchart TD
CriticalEvent["Critical Notification Received"] --> AudioCheck{"Audio enabled?"}
AudioCheck --> |Yes| PlayAlarm["Play Urgent Radar Beep"]
AudioCheck --> |No| VisualOnly["Visual Alert Only"]
PlayAlarm --> StoreMute["Store mute preference in localStorage"]
VisualOnly --> UpdateUI["Update critical alert UI"]
StoreMute --> Acknowledge["User Acknowledges Alert"]
UpdateUI --> Acknowledge
Acknowledge --> ClearAlert["Clear critical alert state"]
ClearAlert --> UpdateCounts["Update notification counts"]
```

**Diagram sources**
- [SocketContext.jsx:96-128](file://frontend/src/context/SocketContext.jsx#L96-L128)
- [SocketContext.jsx:334-356](file://frontend/src/context/SocketContext.jsx#L334-L356)

**Section sources**
- [SocketContext.jsx:139-193](file://frontend/src/context/SocketContext.jsx#L139-L193)
- [SocketContext.jsx:210-236](file://frontend/src/context/SocketContext.jsx#L210-L236)

## Subscription Management

### User Subscription Patterns

The subscription system manages per-user notification preferences and connection states through a centralized registry.

```mermaid
classDiagram
class SubscriptionManager {
+subscribe(userId, channels) void
+unsubscribe(userId, channels) void
+getSubscriptions(userId) Set~channel~
+broadcastToChannel(channel, event, data) void
}
class UserRegistry {
+userSockets Map~userId, Set~socketId~~
+register(userId, socketId) void
+unregister(userId, socketId) void
+getSockets(userId) Set~socketId~
}
class ChannelRegistry {
+channels Map~channelName, Set~userId~~
+join(userId, channel) void
+leave(userId, channel) void
+getMembers(channel) Set~userId~
}
SubscriptionManager --> UserRegistry : "manages connections"
SubscriptionManager --> ChannelRegistry : "manages channels"
```

**Diagram sources**
- [socketService.js:5](file://backend/src/services/socketService.js#L5)
- [socketService.js:77-86](file://backend/src/services/socketService.js#L77-L86)

### Connection State Management

The system maintains connection state through a robust registry that tracks user-to-socket mappings and handles connection cleanup.

**Section sources**
- [socketService.js:5-6](file://backend/src/services/socketService.js#L5-L6)
- [socketService.js:77-86](file://backend/src/services/socketService.js#L77-L86)

## Reconnection Strategies

### Client-Side Reconnection

The frontend implements comprehensive reconnection strategies with exponential backoff and transport fallback mechanisms.

```mermaid
flowchart TD
ConnectionAttempt["Connection Attempt"] --> TransportCheck{"Transport Available?"}
TransportCheck --> |WebSocket| TryWebSocket["Try WebSocket"]
TransportCheck --> |Polling| TryPolling["Try Polling"]
TryWebSocket --> WSConnected{"Connected?"}
TryPolling --> PCConnected{"Connected?"}
WSConnected --> |Yes| Success["Connection Success"]
PCConnected --> |Yes| Success
WSConnected --> |No| SwitchTransport["Switch to Polling"]
PCConnected --> |No| SwitchTransport
SwitchTransport --> Backoff["Exponential Backoff<br/>1s, 2s, 4s, 8s, 16s, 32s, 5000ms max"]
Backoff --> RetryAttempt["Retry Connection"]
RetryAttempt --> TransportCheck
Success --> AuthCheck["JWT Authentication Check"]
AuthCheck --> SyncState["Sync Local State"]
SyncState --> Ready["Ready for Real-Time Updates"]
```

**Diagram sources**
- [SocketContext.jsx:214-218](file://frontend/src/context/SocketContext.jsx#L214-L218)

### Server-Side Connection Handling

The server maintains connection state and gracefully handles client disconnections with automatic cleanup.

**Section sources**
- [SocketContext.jsx:214-218](file://frontend/src/context/SocketContext.jsx#L214-L218)
- [socketService.js:63-71](file://backend/src/services/socketService.js#L63-L71)

## Message Queuing for Offline Clients

### Offline Message Delivery

The system implements a message queuing mechanism to handle offline clients and ensure no notifications are lost during temporary disconnections.

```mermaid
sequenceDiagram
participant Producer as "Notification Producer"
participant Queue as "Message Queue"
participant Consumer as "Offline Client"
participant Server as "Socket Server"
Producer->>Queue : Enqueue notification
Queue->>Queue : Persist in memory storage
Consumer->>Server : Connect
Server->>Queue : Check for queued messages
Queue-->>Server : Return pending notifications
Server->>Consumer : Deliver queued messages
Consumer->>Server : Acknowledge receipt
Server->>Queue : Remove delivered messages
```

**Diagram sources**
- [queueManager.js](file://backend/src/services/queueManager.js)

### Queue Management Features

The queue system provides:

- **Message Persistence**: Temporary storage of notifications until client acknowledges receipt
- **Delivery Guarantees**: Ensures all queued messages are delivered upon client reconnection
- **Memory Management**: Automatic cleanup of delivered messages to prevent memory leaks
- **Priority Handling**: Supports different priority levels for message processing

**Section sources**
- [queueManager.js](file://backend/src/services/queueManager.js)

## Real-World Examples

### Expense Status Update Example

Real-time expense status updates demonstrate the system's capability to synchronize state changes across all connected clients.

```mermaid
sequenceDiagram
participant Admin as "Expense Approver"
participant API as "Expense API"
participant Socket as "Socket Service"
participant Dashboard as "Approver Dashboard"
participant Requester as "Expense Requester"
Admin->>API : Update expense status
API->>Socket : Broadcast status change
Socket->>Dashboard : Emit 'expense_status_update'
Socket->>Requester : Emit 'expense_status_update'
Dashboard->>Dashboard : Update expense row color/status
Requester->>Requester : Show status change notification
Requester->>Requester : Update personal dashboard widgets
```

### Approval Notification Example

The approval notification system provides immediate feedback to relevant parties when action items require attention.

```mermaid
sequenceDiagram
participant System as "Approval System"
participant Socket as "Socket Service"
participant Approver as "Approvers"
participant Admin as "Administrators"
System->>Socket : sendToUser(approverId, 'approval_required', data)
Socket->>Approver : Emit targeted approval notification
Approver->>Approver : Show urgent notification badge
Approver->>Approver : Highlight pending approvals
System->>Socket : broadcast('new_notification', data)
Socket->>Admin : Emit broadcast notification
Admin->>Admin : Update system-wide alert counters
```

### System Alert Example

Critical system alerts utilize the urgent notification system with audio feedback and visual indicators.

```mermaid
sequenceDiagram
participant Monitor as "System Monitor"
participant Socket as "Socket Service"
participant Users as "All Connected Users"
Monitor->>Socket : sendToUser(userId, 'system_alert', criticalData)
Socket->>Users : Emit urgent notification with audio
Users->>Users : Play radar beep sound
Users->>Users : Display critical alert banner
Users->>Users : Flash urgent notification icon
```

**Section sources**
- [socketService.js:77-94](file://backend/src/services/socketService.js#L77-L94)
- [SocketContext.jsx:225-236](file://frontend/src/context/SocketContext.jsx#L225-L236)

## Implementation Details

### Backend Architecture

The backend implements a modular Socket.IO service with JWT authentication middleware and connection management.

```mermaid
graph TB
subgraph "Backend Services"
SocketService[socketService.js]
AuthMiddleware[jwt middleware]
UserRegistry[userSockets registry]
end
subgraph "Controllers"
NotificationController[notificationCenterController.js]
ApprovalController[approvalController.js]
ExpenseController[expenseController.js]
end
subgraph "External Services"
NotificationDispatcher[notificationDispatcher.js]
QueueManager[queueManager.js]
end
SocketService --> AuthMiddleware
SocketService --> UserRegistry
NotificationController --> SocketService
ApprovalController --> SocketService
ExpenseController --> SocketService
NotificationDispatcher --> SocketService
QueueManager --> SocketService
```

**Diagram sources**
- [socketService.js:1-101](file://backend/src/services/socketService.js#L1-L101)
- [notificationCenterController.js](file://backend/src/controllers/notificationCenterController.js)
- [notificationDispatcher.js](file://backend/src/services/notificationDispatcher.js)

### Frontend Integration

The frontend integrates WebSocket functionality through a React context provider that manages connection state, notification handling, and user interactions.

**Section sources**
- [socketService.js:1-101](file://backend/src/services/socketService.js#L1-L101)
- [SocketContext.jsx:130-375](file://frontend/src/context/SocketContext.jsx#L130-L375)

## Troubleshooting Guide

### Common Connection Issues

**Connection Refused Errors**
- Verify Socket.IO server is running and accessible
- Check CORS configuration allows frontend origin
- Ensure JWT_SECRET environment variable is set

**Authentication Failures**
- Validate JWT token format and expiration
- Confirm token was generated with correct secret
- Check user ID exists in database

**Message Delivery Issues**
- Verify user is properly registered in userSockets map
- Check socket connection state
- Ensure event names match exactly (case-sensitive)

### Performance Optimization

**Connection Pool Management**
- Monitor userSockets map size to prevent memory leaks
- Implement connection cleanup on disconnect
- Use exponential backoff for reconnection attempts

**Message Processing**
- Batch notification updates to reduce DOM re-renders
- Implement debouncing for rapid notification streams
- Use virtual scrolling for large notification lists

### Debugging Tools

Enable debug logging by setting the DEBUG environment variable to include "socket.io":

```bash
DEBUG=socket.io npm start
```

Monitor connection metrics through Socket.IO instrumentation and implement custom logging for authentication events.

**Section sources**
- [socketService.js:63-71](file://backend/src/services/socketService.js#L63-L71)
- [SocketContext.jsx:221-223](file://frontend/src/context/SocketContext.jsx#L221-L223)

## Conclusion

The Real-Time Communication API provides a robust foundation for live updates, notifications, and dashboard synchronization in the Petty Cash management system. Its dual-transport approach ensures compatibility across diverse network environments, while the flexible authentication system supports both authenticated user experiences and anonymous access.

The implementation demonstrates best practices for WebSocket architecture including proper connection lifecycle management, efficient message broadcasting, and comprehensive reconnection strategies. The system's modular design facilitates easy extension for additional notification types and real-time features as the application evolves.

Key strengths include:
- **Reliable Delivery**: Both WebSocket and polling fallback mechanisms
- **Flexible Authentication**: Optional JWT-based user identification
- **Scalable Broadcasting**: Efficient user-targeted and global notifications
- **Robust Error Handling**: Comprehensive reconnection and recovery strategies
- **Performance Optimized**: Memory-efficient connection management and message processing

This API serves as a solid foundation for real-time collaboration features and can be extended to support additional use cases such as live chat, collaborative editing, and system monitoring dashboards.