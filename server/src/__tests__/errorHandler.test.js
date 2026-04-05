const request = require('supertest');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

// Build a minimal test app that triggers specific errors
function buildTestApp(errorFactory) {
  const app = express();
  app.get('/test', (req, res, next) => {
    next(errorFactory());
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('should return 404 for Prisma P2025 error', async () => {
    const app = buildTestApp(() =>
      Object.assign(new Error('Not found'), { code: 'P2025' })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Record not found.');
  });

  it('should return 409 for Prisma P2002 error', async () => {
    const app = buildTestApp(() =>
      Object.assign(new Error('Duplicate'), { code: 'P2002' })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'A record with this value already exists.');
  });

  it('should return custom statusCode if set on error', async () => {
    const app = buildTestApp(() =>
      Object.assign(new Error('Bad request'), { statusCode: 400 })
    );
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad request');
  });

  it('should return 500 for generic errors', async () => {
    const app = buildTestApp(() => new Error('Something broke'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Something broke');
  });

  it('should return 500 with default message if error has no message', async () => {
    const app = buildTestApp(() => ({}));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error.');
  });
});
