const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const prisma = require('../utils/prisma');

const generateToken = (user) =>
  jwt.sign(user, process.env.JWT_SECRET || 'test-secret-key');

const adminUser      = { id: 'admin-1',      role: 'ADMIN',      organizationId: 'org-1' };
const supervisorUser = { id: 'supervisor-1', role: 'SUPERVISOR', organizationId: 'org-1' };
const employeeUser   = { id: 'employee-1',   role: 'EMPLOYEE',   organizationId: 'org-1' };

const adminToken      = generateToken(adminUser);
const supervisorToken = generateToken(supervisorUser);
const employeeToken   = generateToken(employeeUser);

const mockNotification = {
  id: 'notif-1',
  userId: 'employee-1',
  message: 'You have a new task',
  isRead: false,
  isUrgent: false,
  isAcknowledged: false,
  createdAt: new Date().toISOString(),
};

const mockUrgentNotification = {
  ...mockNotification,
  id: 'notif-2',
  isUrgent: true,
  isAcknowledged: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('Notification Routes', () => {

  describe('GET /api/notifications', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findMany.mockResolvedValue([mockNotification]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.notification.findMany.mockResolvedValue([mockNotification]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/notifications/urgent', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/notifications/urgent');
      expect(res.status).toBe(401);
    });

    it('should return 200 with urgent notifications', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findMany.mockResolvedValue([mockUrgentNotification]);

      const res = await request(app)
        .get('/api/notifications/urgent')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/notifications/urgent', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/notifications/urgent').send({ message: 'Urgent!' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/notifications/urgent')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ message: 'Urgent!' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .post('/api/notifications/urgent')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ message: 'Urgent!' });
      expect(res.status).toBe(403);
    });

    it('should return 201 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([employeeUser]);
      prisma.notification.create.mockResolvedValue(mockUrgentNotification);

      const res = await request(app)
        .post('/api/notifications/urgent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Urgent alert!', broadcast: true });
      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('should return 200 for authenticated user', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/notifications/notif-1/read');
      expect(res.status).toBe(401);
    });

    it('should return 404 if notification not found', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/notifications/nonexistent/read')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 if notification marked read', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const res = await request(app)
        .patch('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/notifications/:id/acknowledge', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/notifications/notif-2/acknowledge');
      expect(res.status).toBe(401);
    });

    it('should return 404 if notification not found', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/notifications/nonexistent/acknowledge')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 if notification acknowledged', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.notification.findUnique.mockResolvedValue(mockUrgentNotification);
      prisma.notification.update.mockResolvedValue({ ...mockUrgentNotification, isAcknowledged: true });

      const res = await request(app)
        .patch('/api/notifications/notif-2/acknowledge')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

});
