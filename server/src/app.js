const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const eodRoutes = require('./routes/eodRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// One-time seed endpoint (protected by secret)
app.post('/api/seed', async (req, res) => {
  const { secret } = req.body;
  if (secret !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const prisma = require('./utils/prisma');
    const adminHash = await bcrypt.hash('admin123', 10);
    const supervisorHash = await bcrypt.hash('supervisor123', 10);
    const employeeHash = await bcrypt.hash('employee123', 10);
    // Create TNT Gymnastics org for deshaun
    const tntOrg = await prisma.organization.upsert({ where: { id: 'tnt-gym-org' }, update: {}, create: { id: 'tnt-gym-org', name: 'TNT Gymnastics' } });
    await prisma.user.upsert({ where: { email: 'shaunm78@me.com' }, update: { role: 'ADMIN', organizationId: tntOrg.id }, create: { email: 'shaunm78@me.com', passwordHash: adminHash, name: 'DeShaun Holden', role: 'ADMIN', organizationId: tntOrg.id } });
    await prisma.user.upsert({ where: { email: 'deshaun@tntgym.org' }, update: { role: 'ADMIN', organizationId: tntOrg.id }, create: { email: 'deshaun@tntgym.org', passwordHash: supervisorHash, name: 'DeShaun', role: 'ADMIN', organizationId: tntOrg.id } });
    const admin = await prisma.user.upsert({ where: { email: 'admin@gym.com' }, update: {}, create: { email: 'admin@gym.com', passwordHash: adminHash, name: 'Admin User', role: 'ADMIN' } });
    const supervisor = await prisma.user.upsert({ where: { email: 'supervisor@gym.com' }, update: {}, create: { email: 'supervisor@gym.com', passwordHash: supervisorHash, name: 'Supervisor User', role: 'SUPERVISOR' } });
    const employee = await prisma.user.upsert({ where: { email: 'employee@gym.com' }, update: {}, create: { email: 'employee@gym.com', passwordHash: employeeHash, name: 'Employee User', role: 'EMPLOYEE', supervisorId: supervisor.id } });
    const template = await prisma.eodTemplate.upsert({ where: { id: 'seed-template-1' }, update: {}, create: { id: 'seed-template-1', title: 'Daily Closing Checklist', createdById: admin.id, items: { create: [{ question: 'Did you lock the front door?', type: 'CHECKBOX', sortOrder: 1 }, { question: 'How many students attended today?', type: 'NUMBER', sortOrder: 2 }, { question: 'Any equipment issues to report?', type: 'TEXT', sortOrder: 3 }, { question: 'Were all mats cleaned and stored?', type: 'CHECKBOX', sortOrder: 4 }, { question: 'Additional notes for tomorrow\'s staff?', type: 'TEXT', sortOrder: 5 }] } } });
    const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    await prisma.task.createMany({ data: [{ title: 'Clean gymnastics mats', description: 'Deep clean all floor mats', category: 'CLEANING', startDate: today, dueDate: tomorrow, assignedToId: employee.id, createdById: supervisor.id }, { title: 'Check vault springs', description: 'Inspect vault springs for wear', category: 'EQUIPMENT_MAINTENANCE', startDate: today, dueDate: new Date(today.getTime() + 3*86400000), assignedToId: employee.id, createdById: supervisor.id }, { title: 'Update class schedule on whiteboard', description: 'Update the weekly class schedule', category: 'CLASSES', startDate: today, dueDate: today, assignedToId: employee.id, createdById: supervisor.id }], skipDuplicates: true });
    res.json({ message: 'Seeded', users: [admin.email, supervisor.email, employee.email], template: template.title });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/eod', eodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Production: serve React client
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;
