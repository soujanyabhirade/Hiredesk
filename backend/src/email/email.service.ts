import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

function sanitizeDiagnostic(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(
      /((?:api[-_]?key|token|password|secret|authorization)\s*["':=]+\s*)["']?[^"',\s}]+/gi,
      '$1[redacted]',
    )
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, '[redacted-email]')
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^"',\s}]+/gi, '[redacted-url]')
    .slice(0, 500);
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendActivationEmail(
    email: string,
    name: string,
    activationUrl: string,
  ): Promise<void> {
    const apiKey = process.env['BREVO_API_KEY'];
    const from = process.env['BREVO_FROM'];

    if (!apiKey || !from) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set BREVO_API_KEY and BREVO_FROM before provisioning a user.',
      );
    }

    let response: Response;

    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: from },
          to: [{ email }],
          subject: 'Activate your HireDesk account',
          textContent: [
            'Welcome to HireDesk.',
            '',
            `Your HireDesk account has been created by an administrator, ${name}.`,
            '',
            `Activate your account and set your password: ${activationUrl}`,
            '',
            'This activation link expires after the configured activation period and can only be used once.',
            'Do not share this activation link with anyone.',
          ].join('\n'),
          htmlContent: `
          <p>Welcome to HireDesk.</p>
          <p>Your HireDesk account has been created by an administrator, ${name}.</p>
          <p>
            <a href="${activationUrl}">Activate Account</a>
          </p>
          <p>This activation link expires after the configured activation period and can only be used once.</p>
          <p>Do not share this activation link with anyone.</p>
        `,
        }),
      });

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Brevo email request failed before receiving a response: ${sanitizeDiagnostic(errorMessage)}`,
      );
      throw new ServiceUnavailableException(
        'The activation email could not be sent. Please verify the Brevo configuration and try again.',
      );
    }

    if (!response.ok) {
      const responseBody = await response.text();
      this.logger.error(
        `Brevo email request returned HTTP ${response.status}: ${sanitizeDiagnostic(responseBody)}`,
      );
      throw new ServiceUnavailableException(
        'The activation email could not be sent. Please verify the Brevo configuration and try again.',
      );
    }
  }
}
