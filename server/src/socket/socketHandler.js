module.exports = function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:user', ({ userId }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on('join:management', () => {
      socket.join('management-room');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
