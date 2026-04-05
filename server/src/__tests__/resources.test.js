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

const mockResource = {
  id: 'resource-1',
  title: 'Training Video',
  url: 'https://example.com/video',
  description: 'A useful resource',
  category: 'TRAINING',
  organizationId: 'org-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('Resource Routes', () => {

  describe('GET /api/resources', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/resources');
      expect(res.status).toBe(401);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.resource.findMany.mockResolvedValue([mockResource]);

      const res = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.findMany.mockResolvedValue([mockResource]);

      const res = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/resources', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/resources').send({ title: 'New', url: 'https://example.com' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'New', url: 'https://example.com' });
      expect(res.status).toBe(403);
    });

    it('should return 400 if title is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://example.com' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if url is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Resource' });
      expect(res.status).toBe(400);
    });

    it('should return 201 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.create.mockResolvedValue(mockResource);

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Training Video', url: 'https://example.com/video' });
      expect(res.status).toBe(201);
    });

    it('should return 201 for SUPERVISOR with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.resource.create.mockResolvedValue(mockResource);

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ title: 'Training Video', url: 'https://example.com/video' });
      expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/resources/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).put('/api/resources/resource-1').send({ title: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .put('/api/resources/resource-1')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Updated', url: 'https://example.com' });
      expect(res.status).toBe(403);
    });

    it('should return 404 if resource not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/resources/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated', url: 'https://example.com' });
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.findUnique.mockResolvedValue(mockResource);
      prisma.resource.update.mockResolvedValue({ ...mockResource, title: 'Updated' });

      const res = await request(app)
        .put('/api/resources/resource-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated', url: 'https://example.com/video' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).delete('/api/resources/resource-1');
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .delete('/api/resources/resource-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 if resource not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/resources/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.resource.findUnique.mockResolvedValue(mockResource);
      prisma.resource.delete.mockResolvedValue(mockResource);

      const res = await request(app)
        .delete('/api/resources/resource-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

});
