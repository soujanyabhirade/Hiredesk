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
    process.env['RESEND_API_KEY'] = 're_test_key';
    process.env['RESEND_FROM'] = 'HireDesk <no-reply@example.test>';
    fetchMock.mockResolvedValue({ ok: true, status: 202 } as Response);
  });

  afterEach(() => {
    delete process.env['RESEND_API_KEY'];
    delete process.env['RESEND_FROM'];
    jest.restoreAllMocks();
  });

  it('sends a branded activation email with the configured URL', async () => {
    const activationUrl = 'https://app.example.test/activate/token';

    await service.sendActivationEmail(
      'user@example.test',
      'Test User',
      activationUrl,
    );

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_test_key',
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining(activationUrl),
    });
  });

  it('rejects when Resend is not configured', async () => {
    delete process.env['RESEND_API_KEY'];

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('Email delivery is not configured');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces Resend delivery failures without exposing email contents', async () => {
    fetchMock.mockRejectedValue(new Error('provider failure'));

    await expect(
      service.sendActivationEmail(
        'user@example.test',
        'Test User',
        'https://app.example.test/activate/token',
      ),
    ).rejects.toThrow('The activation email could not be sent');

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Resend email request failed before receiving a response: provider failure',
    );
  });

  it('logs a sanitized diagnostic when Resend returns an error response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
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

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Resend email request returned HTTP 422: {"message":"Invalid API key for [redacted-email]","token":"[redacted]","url":"[redacted-url]',
    );
  });
});
