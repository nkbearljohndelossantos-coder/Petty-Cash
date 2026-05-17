const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const userSockets = new Map(); // userId -> Set(socketId)

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  // Flexible Authentication middleware: does not block connection, parses userId if token is present!
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch (err) {
        console.log('[Socket.IO] Token verification failed, connecting as guest');
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId ? String(socket.userId) : null;
    
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`User ${userId} connected via socket ${socket.id}`);
    } else {
      console.log(`Guest user connected via socket ${socket.id}`);
    }

    // Support user example sendNotification event (broadcasts receiveNotification & new_notification)
    socket.on('sendNotification', (data) => {
      console.log('[Socket.IO] Custom sendNotification event received:', data);
      
      // 1. Broadcast receiveNotification for custom receivers
      io.emit('receiveNotification', data);
      
      // 2. Broadcast normalized new_notification for main Petty Cash webapp
      io.emit('new_notification', {
        id: Date.now(),
        title: data.postTitle || 'System Notification',
        message: `Post Created By: ${data.postCreatedBy || 'Admin'}`,
        type: 'info',
        priority: 'normal',
        category: 'general',
        acknowledged: false,
        archived: false,
        created_at: new Date()
      });
    });

    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`User ${userId || 'Guest'} disconnected from socket ${socket.id}`);
    });
  });

  return io;
};

const sendToUser = (userId, event, data) => {
  const userIdStr = String(userId);
  if (io && userSockets.has(userIdStr)) {
    userSockets.get(userIdStr).forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
    return true;
  }
  return false;
};

const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
    return true;
  }
  return false;
};

module.exports = {
  initSocket,
  sendToUser,
  broadcast,
  getIO: () => io
};
