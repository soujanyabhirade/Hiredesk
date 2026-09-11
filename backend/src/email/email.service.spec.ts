import { EmailService } from './email.service.js';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('EmailService', () => {
  const sendMail = jest.fn();
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailService();
    process.env['SMTP_HOST'] = 'smtp.example.test';
    process.env['SMTP_PORT'] = '587';
    process.env['SMTP_USER'] = 'smtp-user';
    process.env['SMTP_PASSWORD'] = 'smtp-password';
    process.env['SMTP_FROM'] = 'HireDesk <no-reply@example.test>';
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env['SMTP_HOST'];
    delete process.env['SMTP_PORT'];
    delete process.env['SMTP_USER'];
    delete process.env['SMTP_PASSWORD'];
    delete process.env['SMTP_FROM'];
  });

  it('sends a branded activation email with the configured URL', async () => {
    const activationUrl = 'https://app.example.test/activate/token';

    await service.sendActivationEmail(
      'user@example.test',
      'Test User',
      activationUrl,
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test',
      port: 587,
      secure: false,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'HireDesk <no-reply@example.test>',
        to: 'user@example.test',
        subject: 'Activate your HireDesk account',
        text: expect.stringContaining(activationUrl),
        html: expect.stringContaining(activationUrl),
      }),
    );
  });

  it('rejects when SMTP is not configured', async () => {
    delete process.env['SMTP_HOST'];

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('Email delivery is not configured');

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('surfaces SMTP delivery failures without exposing email contents', async () => {
    sendMail.mockRejectedValue(new Error('provider failure'));

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('The activation email could not be sent');
  });
});
