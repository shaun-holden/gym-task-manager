const socketHandler = require('../socket/socketHandler');

describe('socketHandler', () => {
  let io;
  let socket;
  let connectionCallback;

  beforeEach(() => {
    socket = {
      id: 'socket-123',
      join: jest.fn(),
      on: jest.fn((event, cb) => {
        socket._handlers = socket._handlers || {};
        socket._handlers[event] = cb;
      }),
    };

    io = {
      on: jest.fn((event, cb) => {
        if (event === 'connection') connectionCallback = cb;
      }),
    };

    socketHandler(io);
  });

  it('should register connection handler on io', () => {
    expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('should log and register events on connection', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    connectionCallback(socket);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('socket-123'));
    expect(socket.on).toHaveBeenCalledWith('join:user', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('join:management', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    consoleSpy.mockRestore();
  });

  it('should join user room on join:user with valid userId', () => {
    connectionCallback(socket);
    socket._handlers['join:user']({ userId: 'user-123' });
    expect(socket.join).toHaveBeenCalledWith('user:user-123');
  });

  it('should not join room on join:user if userId is missing', () => {
    connectionCallback(socket);
    socket._handlers['join:user']({});
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('should join management-room on join:management', () => {
    connectionCallback(socket);
    socket._handlers['join:management']();
    expect(socket.join).toHaveBeenCalledWith('management-room');
  });

  it('should log on disconnect', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    connectionCallback(socket);
    socket._handlers['disconnect']();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('socket-123'));
    consoleSpy.mockRestore();
  });
});
