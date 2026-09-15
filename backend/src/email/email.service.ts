import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendActivationEmail(
    email: string,
    name: string,
    activationUrl: string,
  ): Promise<void> {
    const apiKey = process.env['RESEND_API_KEY'];
    const from = process.env['RESEND_FROM'];

    if (!apiKey || !from) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM before provisioning a user.',
      );
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: 'Activate your HireDesk account',
          text: [
            'Welcome to HireDesk.',
            '',
            `Your HireDesk account has been created by an administrator, ${name}.`,
            '',
            `Activate your account and set your password: ${activationUrl}`,
            '',
            'This activation link expires after the configured activation period and can only be used once.',
            'Do not share this activation link with anyone.',
          ].join('\n'),
          html: `
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

      if (!response.ok) {
        throw new Error(`Resend returned HTTP ${response.status}`);
      }
    } catch {
      throw new ServiceUnavailableException(
        'The activation email could not be sent. Please verify the Resend configuration and try again.',
      );
    }
  }
}
