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

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    console.log(`User ${userId} connected via socket ${socket.id}`);

    socket.on('disconnect', () => {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
      }
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    });
  });

  return io;
};

const sendToUser = (userId, event, data) => {
  if (io && userSockets.has(userId)) {
    userSockets.get(userId).forEach(socketId => {
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
