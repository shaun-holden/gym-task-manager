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

const mockUser = {
  id: 'employee-1',
  name: 'Test Employee',
  email: 'employee@test.com',
  role: 'EMPLOYEE',
  isActive: true,
  organizationId: 'org-1',
  supervisorId: 'supervisor-1',
  supervisor: { id: 'supervisor-1', name: 'Supervisor' },
  organization: { id: 'org-1', name: 'Test Org' },
};

beforeEach(() => {
  jest.resetAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('User Routes', () => {

  describe('GET /api/users', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/users/employee-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser)  // authenticate
        .mockResolvedValueOnce(null);      // getUser lookup

      const res = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN viewing any user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser)  // authenticate
        .mockResolvedValueOnce(mockUser);  // getUser lookup

      const res = await request(app)
        .get('/api/users/employee-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for EMPLOYEE viewing themselves', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(employeeUser) // authenticate
        .mockResolvedValueOnce(mockUser);    // getUser lookup

      const res = await request(app)
        .get('/api/users/employee-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 for EMPLOYEE viewing another user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(employeeUser)           // authenticate
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // getUser lookup

      const res = await request(app)
        .get('/api/users/other-user')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/users/employee-1').send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .patch('/api/users/employee-1')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'New Name' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .patch('/api/users/employee-1')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'New Name' });
      expect(res.status).toBe(403);
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      const p2025 = new Error('Record not found');
      p2025.code = 'P2025';
      prisma.user.update.mockRejectedValue(p2025);

      const res = await request(app)
        .patch('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/archive', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).patch('/api/users/employee-1/archive');
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(supervisorUser);

      const res = await request(app)
        .patch('/api/users/employee-1/archive')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser) // authenticate
        .mockResolvedValueOnce(null);     // archiveUser lookup

      const res = await request(app)
        .patch('/api/users/nonexistent/archive')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).delete('/api/users/employee-1');
      expect(res.status).toBe(401);
    });

    it('should return 403 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);

      const res = await request(app)
        .delete('/api/users/employee-1')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .delete('/api/users/employee-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser) // authenticate
        .mockResolvedValueOnce(null);     // deleteUser lookup

      const res = await request(app)
        .delete('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

});

describe('User Happy Paths', () => {

  describe('PATCH /api/users/:id - happy path', () => {
    it('should return 200 for ADMIN updating a user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

      const res = await request(app)
        .patch('/api/users/employee-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/users/:id/archive - happy path', () => {
    it('should return 200 for ADMIN archiving a user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser)   // authenticate
        .mockResolvedValueOnce(mockUser);   // archiveUser lookup
      prisma.user.count.mockResolvedValue(2);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      const res = await request(app)
        .patch('/api/users/employee-1/archive')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/users/:id - happy path', () => {
    it('should return 200 for ADMIN deleting a non-admin user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(mockUser);
      prisma.user.findMany.mockResolvedValue([adminUser]); // enough admins remain
      prisma.$transaction.mockResolvedValue([]);

      const res = await request(app)
        .delete('/api/users/employee-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

});
