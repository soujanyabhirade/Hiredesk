import { EmailService } from './email.service.js';
import { Logger } from '@nestjs/common';

describe('EmailService', () => {
  const fetchMock = jest.fn();
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock as typeof fetch);
    service = new EmailService();
    process.env['BREVO_API_KEY'] = 'xkeysib-test-key';
    process.env['BREVO_FROM'] = 'no-reply@example.test';
    fetchMock.mockResolvedValue({ ok: true, status: 202 } as Response);
  });

  afterEach(() => {
    delete process.env['BREVO_API_KEY'];
    delete process.env['BREVO_FROM'];
    jest.restoreAllMocks();
  });

  it('sends a branded activation email with the configured URL', async () => {
    const activationUrl = 'https://app.example.test/activate/token';

    await service.sendActivationEmail(
      'user@example.test',
      'Test User',
      activationUrl,
    );

    expect(fetchMock).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': 'xkeysib-test-key',
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining(activationUrl),
    });
  });

  it('rejects when Brevo is not configured', async () => {
    delete process.env['BREVO_API_KEY'];

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('Email delivery is not configured');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces Brevo delivery failures without exposing email contents', async () => {
    fetchMock.mockRejectedValue(new Error('provider failure'));

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('The activation email could not be sent');

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Brevo email request failed before receiving a response: provider failure',
    );
  });

  it('logs a sanitized diagnostic when Brevo returns an error response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          apiKey: 'xkeysib-secret-key',
          password: 'response-password',
          databaseUrl: 'postgresql://user:database-password@db.example.test:5432/hiredesk',
          jwtSecret: 'response-jwt-secret',
          message: 'Invalid API key for user@example.test',
          token: 'activation-token',
          url: 'https://api.example.test/error',
        }),
      ),
    } as unknown as Response);

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('The activation email could not be sent');

    const [diagnostic] = (Logger.prototype.error as jest.Mock).mock.calls[0];

    expect(diagnostic).toContain('Brevo email request returned HTTP 422:');
    expect(diagnostic).toContain('[redacted-email]');
    expect(diagnostic).toContain('token":"[redacted]');
    expect(diagnostic).toContain('[redacted-url]');
    expect(diagnostic).toContain('apiKey":"[redacted]');
    expect(diagnostic).toContain('password":"[redacted]');
    expect(diagnostic).toContain('jwtSecret":"[redacted]');
    expect(diagnostic).not.toContain('user@example.test');
    expect(diagnostic).not.toContain('xkeysib-secret-key');
    expect(diagnostic).not.toContain('response-password');
    expect(diagnostic).not.toContain('postgresql://user:database-password@db.example.test:5432/hiredesk');
    expect(diagnostic).not.toContain('response-jwt-secret');
    expect(diagnostic).not.toContain('activation-token');
    expect(diagnostic).not.toContain('https://api.example.test/error');
  });
});
