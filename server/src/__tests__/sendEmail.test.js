jest.mock('nodemailer');

describe('sendEmail utility', () => {
  let sendEmail;
  let mockSendMail;

  beforeEach(() => {
    jest.resetModules();
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    const nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
  });

  it('should return null and skip sending if SMTP not configured', async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    sendEmail = require('../utils/sendEmail');
    const result = await sendEmail({ to: 'test@test.com', subject: 'Test', html: '<p>Test</p>' });
    expect(result).toBeNull();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should call transporter.sendMail if SMTP is configured', async () => {
    process.env.SMTP_USER = 'user@smtp.com';
    process.env.SMTP_PASS = 'secret';

    sendEmail = require('../utils/sendEmail');
    await sendEmail({ to: 'test@test.com', subject: 'Hello', html: '<p>Hi</p>' });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@test.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      })
    );
  });

  it('should use SMTP_FROM env var if set', async () => {
    process.env.SMTP_USER = 'user@smtp.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'custom@gym.com';

    sendEmail = require('../utils/sendEmail');
    await sendEmail({ to: 'test@test.com', subject: 'Hello', html: '<p>Hi</p>' });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@gym.com' })
    );
  });

  afterEach(() => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });
});
