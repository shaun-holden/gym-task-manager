const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminHash = await bcrypt.hash('admin123', 10);
  const supervisorHash = await bcrypt.hash('supervisor123', 10);
  const employeeHash = await bcrypt.hash('employee123', 10);

  const deshaunAdmin = await prisma.user.upsert({
    where: { email: 'shaunm78@me.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'shaunm78@me.com',
      passwordHash: adminHash,
      name: 'DeShaun Holden',
      role: 'ADMIN',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: {
      email: 'admin@gym.com',
      passwordHash: adminHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@gym.com' },
    update: {},
    create: {
      email: 'supervisor@gym.com',
      passwordHash: supervisorHash,
      name: 'Supervisor User',
      role: 'SUPERVISOR',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@gym.com' },
    update: {},
    create: {
      email: 'employee@gym.com',
      passwordHash: employeeHash,
      name: 'Employee User',
      role: 'EMPLOYEE',
      supervisorId: supervisor.id,
    },
  });

  console.log('Users created:', { admin: admin.email, supervisor: supervisor.email, employee: employee.email });

  // Create EOD template
  const template = await prisma.eodTemplate.upsert({
    where: { id: 'seed-template-1' },
    update: {},
    create: {
      id: 'seed-template-1',
      title: 'Daily Closing Checklist',
      createdById: admin.id,
      items: {
        create: [
          { question: 'Did you lock the front door?', type: 'CHECKBOX', sortOrder: 1 },
          { question: 'How many students attended today?', type: 'NUMBER', sortOrder: 2 },
          { question: 'Any equipment issues to report?', type: 'TEXT', sortOrder: 3 },
          { question: 'Were all mats cleaned and stored?', type: 'CHECKBOX', sortOrder: 4 },
          { question: 'Additional notes for tomorrow\'s staff?', type: 'TEXT', sortOrder: 5 },
        ],
      },
    },
  });

  console.log('EOD template created:', template.title);

  // Create sample tasks
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Clean gymnastics mats',
        description: 'Deep clean all floor mats in the main gym area',
        category: 'CLEANING',
        startDate: today,
        dueDate: tomorrow,
        assignedToId: employee.id,
        createdById: supervisor.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Check vault springs',
        description: 'Inspect vault springs for wear and replace if needed',
        category: 'EQUIPMENT_MAINTENANCE',
        startDate: today,
        dueDate: threeDays,
        assignedToId: employee.id,
        createdById: supervisor.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Update class schedule on whiteboard',
        description: 'Update the weekly class schedule board in the lobby',
        category: 'CLASSES',
        startDate: today,
        dueDate: today,
        assignedToId: employee.id,
        createdById: supervisor.id,
      },
    }),
  ]);

  console.log('Tasks created:', tasks.length);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
