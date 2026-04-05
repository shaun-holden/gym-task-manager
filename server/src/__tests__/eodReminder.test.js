jest.mock('node-cron');
jest.mock('../utils/sendEmail');
jest.mock('../utils/notify');

const cron = require('node-cron');
const prisma = require('../utils/prisma');
const sendEmail = require('../utils/sendEmail');
const { createNotification } = require('../utils/notify');
const startEodReminder = require('../jobs/eodReminder');

describe('eodReminder', () => {
  let io;
  let cronCallback;

  const mockTemplates = [
    { id: 'template-1', title: 'Daily EOD', isActive: true, organizationId: 'org-1' },
  ];

  const mockEmployees = [
    { id: 'emp-1', name: 'Alice', email: 'alice@test.com', supervisorId: 'sup-1', organizationId: 'org-1' },
    { id: 'emp-2', name: 'Bob',   email: 'bob@test.com',   supervisorId: 'sup-1', organizationId: 'org-1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    io = {};
    cron.schedule.mockImplementation((expr, cb) => { cronCallback = cb; });
    sendEmail.mockResolvedValue(null);
    createNotification.mockResolvedValue({});
  });

  it('should schedule cron with default time 17:00 on weekdays', () => {
    delete process.env.EOD_REMINDER_TIME;
    startEodReminder(io);
    expect(cron.schedule).toHaveBeenCalledWith('00 17 * * 1-5', expect.any(Function));
  });

  it('should schedule cron with custom EOD_REMINDER_TIME', () => {
    process.env.EOD_REMINDER_TIME = '09:30';
    startEodReminder(io);
    expect(cron.schedule).toHaveBeenCalledWith('30 09 * * 1-5', expect.any(Function));
    delete process.env.EOD_REMINDER_TIME;
  });

  it('should send email and notification to employees missing EOD', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockResolvedValue(mockTemplates);
    prisma.user.findMany.mockResolvedValue(mockEmployees);
    prisma.eodSubmission.findFirst.mockResolvedValue(null); // no submission found

    await cronCallback();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledWith(io, expect.objectContaining({
      userId: 'emp-1',
      type: 'EOD_REMINDER',
    }));
  });

  it('should send supervisor summary notification if employees are missing', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockResolvedValue(mockTemplates);
    prisma.user.findMany.mockResolvedValue(mockEmployees);
    prisma.eodSubmission.findFirst.mockResolvedValue(null);

    await cronCallback();

    expect(createNotification).toHaveBeenCalledWith(io, expect.objectContaining({
      userId: 'sup-1',
      type: 'EOD_REMINDER',
      message: expect.stringContaining('Alice'),
    }));
  });

  it('should not send email if employee already submitted', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockResolvedValue(mockTemplates);
    prisma.user.findMany.mockResolvedValue(mockEmployees);
    prisma.eodSubmission.findFirst.mockResolvedValue({ id: 'existing-sub' });

    await cronCallback();

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should skip template if org does not match employee org', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockResolvedValue([
      { id: 'template-2', title: 'Other Org EOD', isActive: true, organizationId: 'org-2' },
    ]);
    prisma.user.findMany.mockResolvedValue(mockEmployees);
    prisma.eodSubmission.findFirst.mockResolvedValue(null);

    await cronCallback();

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should not send supervisor notification if employee has no supervisorId', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockResolvedValue(mockTemplates);
    prisma.user.findMany.mockResolvedValue([
      { id: 'emp-3', name: 'Charlie', email: 'charlie@test.com', supervisorId: null, organizationId: 'org-1' },
    ]);
    prisma.eodSubmission.findFirst.mockResolvedValue(null);

    await cronCallback();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    // no supervisor notification since supervisorId is null
    const supCalls = createNotification.mock.calls.filter(
      ([, args]) => args.userId === null || args.userId === undefined
    );
    expect(supCalls).toHaveLength(0);
  });

  it('should handle errors gracefully without throwing', async () => {
    startEodReminder(io);
    prisma.eodTemplate.findMany.mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(cronCallback()).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
