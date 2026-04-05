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
  jest.resetAllMocks();
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

  describe('PUT /api/eod/templates/:id', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).put('/api/eod/templates/template-1').send({ title: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .put('/api/eod/templates/template-1')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(403);
    });

    it('should return 404 if template not found', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/eod/templates/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('should return 200 for ADMIN updating template', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.$transaction.mockResolvedValue({ ...mockTemplate, title: 'Updated' });

      const res = await request(app)
        .put('/api/eod/templates/template-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Template' });
      expect(res.status).toBe(200);
    });

    it('should return 403 for SUPERVISOR editing another supervisors template', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.eodTemplate.findUnique.mockResolvedValue({ ...mockTemplate, createdById: 'other-supervisor' });

      const res = await request(app)
        .put('/api/eod/templates/template-1')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/eod/submissions', () => {
    const validSubmissionData = {
      templateId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      responses: [{ templateItemId: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890', response: 'Done' }],
    };

    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/eod/submissions').send(validSubmissionData);
      expect(res.status).toBe(401);
    });

    it('should return 400 if templateId is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ responses: [{ templateItemId: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890', response: 'Done' }] });
      expect(res.status).toBe(400);
    });

    it('should return 400 if responses is empty', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ templateId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', responses: [] });
      expect(res.status).toBe(400);
    });

    it('should return 201 for EMPLOYEE submitting own EOD', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.eodSubmission.create.mockResolvedValue({
        ...mockSubmission,
        employee: { id: 'employee-1', name: 'Employee', supervisorId: 'supervisor-1' },
        template: { id: 'template-1', title: 'Daily EOD' },
      });
      prisma.user.findMany.mockResolvedValue([]); // no admins to notify
      prisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validSubmissionData);
      expect(res.status).toBe(201);
    });

    it('should return 201 for ADMIN submitting on behalf of employee', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.create.mockResolvedValue({
        ...mockSubmission,
        employee: { id: 'employee-1', name: 'Employee', supervisorId: 'supervisor-1' },
        template: { id: 'template-1', title: 'Daily EOD' },
      });
      prisma.user.findMany.mockResolvedValue([]); // no admins to notify
      prisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validSubmissionData, employeeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(201);
    });

    it('should return 403 for EMPLOYEE submitting on behalf of another', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ ...validSubmissionData, employeeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for SUPERVISOR submitting for non-subordinate', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'other-employee' }]); // subordinates don't include target

      const res = await request(app)
        .post('/api/eod/submissions')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ ...validSubmissionData, employeeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/eod/submissions - filters', () => {
    it('should return 200 for SUPERVISOR with subordinate scoping', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'employee-1' }]);
      prisma.eodSubmission.findMany.mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/eod/submissions')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 for EMPLOYEE viewing another employees submissions', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const res = await request(app)
        .get('/api/eod/submissions?employeeId=other-employee')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 with date filter', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.findMany.mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/eod/submissions?date=2026-04-05')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 with date range filter', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.eodSubmission.findMany.mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/eod/submissions?startDate=2026-04-01&endDate=2026-04-05')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/eod/submissions/:id - permissions', () => {
    it('should return 403 for EMPLOYEE viewing another employees submission', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.eodSubmission.findUnique.mockResolvedValue({ ...mockSubmission, employeeId: 'other-employee' });

      const res = await request(app)
        .get('/api/eod/submissions/submission-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 for EMPLOYEE viewing own submission', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.eodSubmission.findUnique.mockResolvedValue(mockSubmission);

      const res = await request(app)
        .get('/api/eod/submissions/submission-1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 200 for SUPERVISOR viewing subordinates submission', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.eodSubmission.findUnique.mockResolvedValue(mockSubmission);
      prisma.user.findMany.mockResolvedValue([{ id: 'employee-1' }]);

      const res = await request(app)
        .get('/api/eod/submissions/submission-1')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 for SUPERVISOR viewing non-subordinates submission', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.eodSubmission.findUnique.mockResolvedValue({ ...mockSubmission, employeeId: 'other-employee' });
      prisma.user.findMany.mockResolvedValue([{ id: 'employee-1' }]); // other-employee not in list

      const res = await request(app)
        .get('/api/eod/submissions/submission-1')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
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

    it('should return 200 with empty missing when no employees', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.eodTemplate.findMany.mockResolvedValue([mockTemplate]);

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.missing).toEqual([]);
    });

    it('should return 200 with empty missing when no templates', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'emp-1', name: 'Emp' }]);
      prisma.eodTemplate.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.missing).toEqual([]);
    });

    it('should return missing employees who have not submitted', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'emp-1', name: 'Employee 1' }]);
      prisma.eodTemplate.findMany.mockResolvedValue([{ id: 'tmpl-1', title: 'Daily EOD' }]);
      prisma.eodSubmission.findFirst.mockResolvedValue(null); // no submission found

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.missing).toEqual([
        { id: 'emp-1', name: 'Employee 1', templates: ['Daily EOD'] },
      ]);
    });

    it('should return 200 for SUPERVISOR', async () => {
      prisma.user.findUnique.mockResolvedValue(supervisorUser);
      prisma.user.findMany.mockResolvedValue([{ id: 'emp-1', name: 'Employee 1' }]);
      prisma.eodTemplate.findMany.mockResolvedValue([{ id: 'tmpl-1', title: 'Daily EOD' }]);
      prisma.eodSubmission.findFirst.mockResolvedValue({ id: 'sub-1' }); // already submitted

      const res = await request(app)
        .get('/api/eod/missing')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.missing).toEqual([]);
    });
  });

});
