import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { buildApprovalEmailHtml } from './templates/approval-email.template';

export interface ApprovalEmailPayload {
  customerName: string;
  customerEmail: string;
  projectName: string;
  roundNumber: number;
  tokenUrl: string;
  pdfBuffer: Buffer;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private senderEmail!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration incomplete — email sending will be disabled',
      );
      return;
    }

    this.senderEmail = user;

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`Mail transporter initialized (host: ${host})`);
  }

  /**
   * ส่ง Email แจ้งผลการอนุมัติให้ลูกค้า (fire-and-forget)
   * ถ้าเกิด error จะแค่ log ไว้ ไม่ throw ออกไป
   */
  async sendApprovalEmail(payload: ApprovalEmailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Mail transporter not configured — skipping email send',
      );
      return;
    }

    try {
      const html = buildApprovalEmailHtml({
        customerName: payload.customerName,
        projectName: payload.projectName,
        roundNumber: payload.roundNumber,
        tokenUrl: payload.tokenUrl,
      });

      await this.transporter.sendMail({
        from: `"POYSIAN รับตรวจบ้าน" <${this.senderEmail}>`,
        to: payload.customerEmail,
        subject: `✅ รายงานตรวจบ้านผ่านการอนุมัติ — ${payload.projectName} (ครั้งที่ ${payload.roundNumber})`,
        html,
        attachments: [
          {
            filename: `รายงานตรวจบ้าน_${payload.projectName}_ครั้งที่${payload.roundNumber}.pdf`,
            content: payload.pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(
        `✅ Email sent to ${payload.customerEmail} for project "${payload.projectName}" round ${payload.roundNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${payload.customerEmail}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
