
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationCode(
    recipient: string,
    code: string,
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const testRecipient = process.env.EMAIL_TEST_RECIPIENT
      ?.trim()
      .toLowerCase();

    if (!apiKey || !from || !testRecipient) {
      throw new ServiceUnavailableException(
        'Email service is not configured.',
      );
    }

    if (recipient.trim().toLowerCase() !== testRecipient) {
      throw new ServiceUnavailableException(
        'Email testing is restricted to the configured test recipient.',
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: 'Verify your 247 Jtech Hub account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
            <h2 style="color: #741B2B;">Verify your email address</h2>
            <p>Welcome to 247 Jtech Hub.</p>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 18px; background: #f7f3f4; text-align: center;">
              ${code}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this code, ignore this email.</p>
            <p>247 Jtech Hub</p>
          </div>
        `,
        text: `Your 247 Jtech Hub verification code is ${code}. It expires in 10 minutes.`,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }
}
