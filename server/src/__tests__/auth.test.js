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
