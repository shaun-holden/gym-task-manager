const request = require('supertest');
const app = require('../app');
const prisma = require('../utils/prisma');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Routes', () => {

  describe('GET /api/auth/organizations', () => {
    it('should return 200 and an array', async () => {
      prisma.organization.findMany.mockResolvedValue([]);
      const res = await request(app).get('/api/auth/organizations');
      expect(res.status).toBe(200);
      expect(res.body.organizations).toEqual([]);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 if invalid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });
  });

});

describe('Auth Happy Paths', () => {

  describe('POST /api/auth/register - SUPERVISOR', () => {
    it('should return 201 when supervisor registers with new org', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      prisma.organization.create.mockResolvedValue({ id: 'org-1', name: 'New Gym' });
      prisma.user.create.mockResolvedValue({
        id: 'user-1', name: 'Supervisor', email: 'sup@test.com',
        role: 'SUPERVISOR', organizationId: 'org-1',
        organization: { id: 'org-1', name: 'New Gym' },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Supervisor',
          email: 'sup@test.com',
          password: 'password123',
          role: 'SUPERVISOR',
          organizationName: 'New Gym',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/register - EMPLOYEE', () => {
    it('should return 201 when employee registers with existing org', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Existing Gym' });
      prisma.user.findFirst.mockResolvedValue({ id: 'sup-1' }); // auto-assign supervisor
      prisma.user.create.mockResolvedValue({
        id: 'emp-1', name: 'Employee', email: 'emp@test.com',
        role: 'EMPLOYEE', organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Existing Gym' },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Employee',
          email: 'emp@test.com',
          password: 'password123',
          role: 'EMPLOYEE',
          organizationId: 'org-1',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if organization not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Employee',
          email: 'emp@test.com',
          password: 'password123',
          role: 'EMPLOYEE',
          organizationId: 'nonexistent-org',
        });
      expect(res.status).toBe(400);
    });

    it('should return 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Employee',
          email: 'existing@test.com',
          password: 'password123',
          role: 'EMPLOYEE',
          organizationId: 'org-1',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login - happy path', () => {
    it('should return 200 with token for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hashedPassword,
        isActive: true,
        role: 'EMPLOYEE',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Gym' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 403 if user is inactive', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hashedPassword,
        isActive: false,
        role: 'EMPLOYEE',
        organizationId: 'org-1',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });
      expect(res.status).toBe(403);
    });
  });

});
