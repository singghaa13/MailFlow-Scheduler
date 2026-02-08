import { Resend } from 'resend';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export class EmailService {
  private resend: Resend;

  constructor() {
    if (!env.email.resendApiKey) {
      logger.warn('RESEND_API_KEY is not set. Email sending will fail.');
    }
    this.resend = new Resend(env.email.resendApiKey);
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      logger.info('Attempting to send email via Resend', {
        to: payload.to,
        subject: payload.subject,
      });

      const { data, error } = await this.resend.emails.send({
        from: env.email.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body,
      });

      if (error) {
        throw new Error(`Resend API Error: ${error.message}`);
      }

      logger.info('Email sent successfully via Resend', {
        to: payload.to,
        subject: payload.subject,
        id: data?.id,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send email: ${errorMessage}`, {
        to: payload.to,
        subject: payload.subject,
        error: errorMessage,
      });
      throw error;
    }
  }

  async verifyConnection(): Promise<void> {
    // Resend is stateless/API-based, so generally no persistent "connection" to verify.
    // We could make a dummy API call, but typically we just trust the API key presence.
    if (!env.email.resendApiKey) {
      throw new Error('Resend API Key is missing');
    }
    logger.info('Resend service initialized (stateless)');
  }
}

export const emailService = new EmailService();
