import nodemailer from 'nodemailer';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // TODO: Implement transporter initialization with environment variables
    this.transporter = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpPort === 465, // true for 465, false for others
      auth: {
        user: env.email.smtpUser,
        pass: env.email.smtpPass,
      },
      tls: {
        rejectUnauthorized: false // Helps with self-signed certs or proxy issues
      }
    });
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      // Create a promise with timeout
      const sendPromise = this.transporter.sendMail({
        from: env.email.smtpUser,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timed out after 10s')), 10000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      logger.info('Email sent successfully', {
        to: payload.to,
        subject: payload.subject,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service verified successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Email service verification failed: ${errorMessage}`, {
        error: errorMessage,
      });
      return false;
    }
  }
}

export const emailService = new EmailService();
