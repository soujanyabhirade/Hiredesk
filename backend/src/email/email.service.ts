import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  async sendActivationEmail(
    email: string,
    name: string,
    activationUrl: string,
  ): Promise<void> {
    const host = process.env['SMTP_HOST'];
    const port = process.env['SMTP_PORT'];
    const user = process.env['SMTP_USER'];
    const password = process.env['SMTP_PASSWORD'];
    const from = process.env['SMTP_FROM'];

    if (!host || !port || !user || !password || !from) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set the SMTP environment variables before provisioning a user.',
      );
    }

    const parsedPort = Number(port);
    if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. SMTP_PORT must be a valid port.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parsedPort,
      secure: parsedPort === 465,
      auth: { user, pass: password },
    });

    try {
      await transporter.sendMail({
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
      });
    } catch {
      throw new ServiceUnavailableException(
        'The activation email could not be sent. Please verify the SMTP configuration and try again.',
      );
    }
  }
}
