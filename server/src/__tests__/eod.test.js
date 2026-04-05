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

const mockTemplate = {
  id: 'template-1',
  title: 'Daily EOD',
  isActive: true,
  organizationId: 'org-1',
  createdById: 'supervisor-1',
  items: [{ id: 'item-1', label: 'What did you complete?', type: 'TEXT', order: 1 }],
};

const mockSubmission = {
  id: 'submission-1',
  templateId: 'template-1',
  employeeId: 'employee-1',
  organizationId: 'org-1',
  submittedAt: new Date().toISOString(),
  employee: { id: 'employee-1', name: 'Employee', role: 'EMPLOYEE' },
  template: mockTemplate,
  responses: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(adminUser);
});

describe('EOD Routes', () => {

  describe('GET /api/eod/templates', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/eod/templates');
      expect(res.status).toBe(401);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.findMany.mockResolvedValue([mockTemplate]);

      const res = await request(app)
        .get('/api/eod/templates')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.eodTemplate.findMany.mockResolvedValue([mockTemplate]);

      const res = await request(app)
        .get('/api/eod/templates')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/eod/templates/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/eod/templates/template-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 if template not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/eod/templates/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 if template found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.findUnique.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .get('/api/eod/templates/template-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/eod/templates', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/eod/templates').send({ title: 'New Template' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/eod/templates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'New Template', items: [] });
      expect(res.status).toBe(403);
    });

    it('should return 201 for ADMIN with valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.create.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .post('/api/eod/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Template', items: [{ question: 'Question 1', type: 'TEXT' }] });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/eod/submissions', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/eod/submissions');
      expect(res.status).toBe(401);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.findMany.mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/eod/submissions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.eodSubmission.findMany.mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/eod/submissions')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/eod/submissions/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/eod/submissions/submission-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 if submission not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/eod/submissions/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 if submission found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.findUnique.mockResolvedValue(mockSubmission);

      const res = await request(app)
        .get('/api/eod/submissions/submission-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/eod/missing', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/eod/missing');
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 for ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.eodSubmission.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

});
