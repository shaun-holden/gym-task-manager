const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const prisma = require('../utils/prisma');

// Helper to generate test tokens
const generateToken = (user) =>
  jwt.sign(user, process.env.JWT_SECRET || 'test-secret-key');

const adminUser    = { id: 'admin-1',      role: 'ADMIN',      organizationId: 'org-1' };
const supervisorUser = { id: 'supervisor-1', role: 'SUPERVISOR', organizationId: 'org-1' };
const employeeUser = { id: 'employee-1',   role: 'EMPLOYEE',   organizationId: 'org-1' };

const adminToken      = generateToken(adminUser);
const supervisorToken = generateToken(supervisorUser);
const employeeToken   = generateToken(employeeUser);

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  isComplete: false,
  organizationId: 'org-1',
  assigneeId: 'employee-1',
  createdById: 'supervisor-1',
  assignee: { id: 'employee-1', name: 'Employee', email: 'employee@test.com' },
  createdBy: { id: 'supervisor-1', name: 'Supervisor', email: 'sup@test.com' },
  category: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: authenticate middleware finds the user
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('Task Routes', () => {

  describe('GET /api/tasks', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });

    it('should return 200 for ADMIN with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findMany.mockResolvedValue([mockTask]);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for SUPERVISOR with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'employee-1' }]);
      prisma.task.findMany.mockResolvedValue([mockTask]);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for EMPLOYEE with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.task.findMany.mockResolvedValue([mockTask]);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/tasks', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'New Task' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'New Task', assigneeId: 'employee-1' });
      expect(res.status).toBe(403);
    });

    it('should return 400 if title is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeId: 'employee-1' });
      expect(res.status).toBe(400);
    });

    it('should return 201 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.create.mockResolvedValue(mockTask);
      prisma.user.findFirst.mockResolvedValue(null); // no notification target

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Task', category: 'CLEANING', assignedToId: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/tasks/task-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 if task not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/tasks/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 if task found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(mockTask);

      const res = await request(app)
        .get('/api/tasks/task-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).delete('/api/tasks/task-1');
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 if task not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/tasks/task-1/complete');
      expect(res.status).toBe(401);
    });

    it('should return 404 if task not found', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/tasks/task-1/complete')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(404);
    });
  });

});

describe('Task Happy Paths', () => {

  describe('PUT /api/tasks/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).put('/api/tasks/task-1').send({ title: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .put('/api/tasks/task-1')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(403);
    });

    it('should return 404 if task not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/tasks/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated', category: 'CLEANING', assignedToId: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' });

      const res = await request(app)
        .put('/api/tasks/task-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Task', category: 'CLEANING', assignedToId: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/tasks/:id/complete - happy path', () => {
    it('should return 200 when employee toggles own task', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.task.findUnique.mockResolvedValue({ ...mockTask, assignedToId: 'employee-1', assignedTo: { id: 'employee-1', name: 'Employee', supervisorId: null } });
      prisma.task.update.mockResolvedValue({ ...mockTask, isCompleted: true, assignedTo: { id: 'employee-1', name: 'Employee' } });
      prisma.user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/tasks/task-1/complete')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 when employee tries to toggle another employees task', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.task.findUnique.mockResolvedValue({ ...mockTask, assignedToId: 'other-employee', assignedTo: { id: 'other-employee', name: 'Other', supervisorId: null } });

      const res = await request(app)
        .patch('/api/tasks/task-1/complete')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/tasks/:id - happy path', () => {
    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.delete.mockResolvedValue(mockTask);

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 when supervisor tries to delete task they did not create', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.task.findUnique.mockResolvedValue({ ...mockTask, createdById: 'other-supervisor' });

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 when supervisor deletes their own task', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.task.findUnique.mockResolvedValue({ ...mockTask, createdById: 'supervisor-1' });
      prisma.task.delete.mockResolvedValue(mockTask);

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });
  });

});
