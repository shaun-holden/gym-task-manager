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

const mockCategory = {
  id: 'cat-1',
  name: 'CUSTOM_CATEGORY',
  organizationId: 'org-1',
  isDefault: false,
};

beforeEach(() => {
  jest.resetAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('Task Category Routes', () => {

  describe('GET /api/task-categories', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/task-categories');
      expect(res.status).toBe(401);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.taskCategoryCustom.findMany.mockResolvedValue([mockCategory]);

      const res = await request(app)
        .get('/api/task-categories')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.taskCategoryCustom.findMany.mockResolvedValue([mockCategory]);

      const res = await request(app)
        .get('/api/task-categories')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/task-categories', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/task-categories').send({ name: 'New Category' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/task-categories')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'New Category' });
      expect(res.status).toBe(403);
    });

    it('should return 400 if name is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .post('/api/task-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 201 for ADMIN with valid name', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.taskCategoryCustom.create.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/api/task-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Custom Category' });
      expect(res.status).toBe(201);
    });

    it('should return 201 for SUPERVISOR with valid name', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.taskCategoryCustom.create.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/api/task-categories')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Custom Category' });
      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /api/task-categories/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).delete('/api/task-categories/cat-1');
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .delete('/api/task-categories/cat-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 if category not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.taskCategoryCustom.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/task-categories/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.taskCategoryCustom.findUnique.mockResolvedValue(mockCategory);
      prisma.taskCategoryCustom.delete.mockResolvedValue(mockCategory);

      const res = await request(app)
        .delete('/api/task-categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

});
