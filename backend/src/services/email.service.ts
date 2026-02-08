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
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds to connect
      greetingTimeout: 5000,    // 5 seconds to wait for greeting
      socketTimeout: 30000,     // 30 seconds of inactivity
      dnsTimeout: 5000,        // 5 seconds for DNS resolution
      family: 4,               // Force IPv4 usage
    } as any);
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      logger.info(`Attempting to send email via ${env.email.smtpHost}:${env.email.smtpPort}`, {
        to: payload.to,
        subject: payload.subject,
      });

      // Create a promise with timeout
      const sendPromise = this.transporter.sendMail({
        from: env.email.smtpUser,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timed out after 30s')), 30000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      logger.info('Email sent successfully', {
        to: payload.to,
        subject: payload.subject,
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
