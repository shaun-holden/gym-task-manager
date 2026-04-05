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

const mockOrg = {
  id: 'org-1',
  name: 'Test Gym',
  _count: { users: 5 },
  users: [{ id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('Organization Routes', () => {

  describe('GET /api/organizations', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/organizations');
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 with organizations for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.organization.findMany.mockResolvedValue([mockOrg]);

      const res = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('organizations');
    });
  });

  describe('POST /api/organizations', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/organizations').send({ name: 'New Gym' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'New Gym' });
      expect(res.status).toBe(403);
    });

    it('should return 400 if name is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 201 for ADMIN with valid name', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.organization.create.mockResolvedValue(mockOrg);

      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Gym' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('organization');
    });
  });

  describe('PUT /api/organizations/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).put('/api/organizations/org-1').send({ name: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .put('/api/organizations/org-1')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(403);
    });

    it('should return 400 if name is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .put('/api/organizations/org-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 200 for ADMIN with valid name', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'Updated Gym' });

      const res = await request(app)
        .put('/api/organizations/org-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Gym' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('organization');
    });

    it('should return 404 if org not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.organization.update.mockRejectedValue(
        Object.assign(new Error('Not found'), { code: 'P2025' })
      );

      const res = await request(app)
        .put('/api/organizations/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Gym' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/organizations/:id/employer', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app)
        .post('/api/organizations/org-1/employer')
        .send({ userId: 'user-1' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .post('/api/organizations/org-1/employer')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ userId: 'user-1' });
      expect(res.status).toBe(403);
    });

    it('should return 200 for ADMIN with valid userId', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.update.mockResolvedValue({
        id: 'user-1', name: 'New Supervisor',
        email: 'sup@test.com', role: 'SUPERVISOR',
      });

      const res = await request(app)
        .post('/api/organizations/org-1/employer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 'user-1' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.update.mockRejectedValue(
        Object.assign(new Error('Not found'), { code: 'P2025' })
      );

      const res = await request(app)
        .post('/api/organizations/org-1/employer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 'nonexistent' });
      expect(res.status).toBe(404);
    });
  });

});
