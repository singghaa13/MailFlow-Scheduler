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
    // Explicitly configure for Gmail SSL (465) + IPv4
    // This avoids "service: gmail" unpredictability and forces a specific, robust connection path.
    const transportConfig = {
      host: env.email.smtpHost, // Should be smtp.gmail.com
      port: 465, // Force SSL port
      secure: true, // Force SSL
      auth: {
        user: env.email.smtpUser,
        pass: env.email.smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 30000,
      dnsTimeout: 5000,
      family: 4, // Force IPv4
      debug: true,
      logger: true
    };

    logger.info('Initializing email transport with strict SSL/IPv4 config', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
    });

    this.transporter = nodemailer.createTransport(transportConfig as any);
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
