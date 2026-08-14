import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

interface RoundApprovedEmailParams {
  to: string;
  customerName: string;
  jobTitle: string;
  roundNumber: number;
  pdfUrl: string | null;
  portalUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // undefined = ยังไม่เคยสร้าง, null = สร้างแล้วแต่ config ไม่ครบ (ไม่ต้องลองสร้างซ้ำทุกครั้ง)
  private transporter: Transporter | null | undefined;

  // แจ้งลูกค้าเมื่อแอดมินอนุมัติรายงานรอบตรวจ — ตั้งใจให้ caller เรียกแบบ fire-and-forget
  // (ไม่ throw ออกไป) เพราะการอนุมัติต้องสำเร็จเสมอแม้อีเมลจะส่งไม่ได้ (SMTP ยังไม่ตั้งค่า/ล่ม)
  async sendRoundApprovedEmail(
    params: RoundApprovedEmailParams,
  ): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      const fromAddress = process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"HIDS" <${fromAddress}>`,
        to: params.to,
        subject: `รายงานการตรวจ "${params.jobTitle}" รอบที่ ${params.roundNumber} ได้รับการอนุมัติแล้ว`,
        text: this.buildRoundApprovedText(params),
        html: this.buildRoundApprovedHtml(params),
      });
      this.logger.log(`ส่งอีเมลแจ้งอนุมัติให้ ${params.to} สำเร็จ (${info.messageId})`);
    } catch (error) {
      this.logger.error(
        `ส่งอีเมลแจ้งอนุมัติรอบตรวจให้ ${params.to} ไม่สำเร็จ`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private getTransporter(): Transporter | null {
    if (this.transporter !== undefined) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        'ยังไม่ได้ตั้งค่า SMTP_HOST/SMTP_USER/SMTP_PASS ใน .env — ข้ามการส่งอีเมล',
      );
      this.transporter = null;
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    return this.transporter;
  }

  private buildRoundApprovedText(params: RoundApprovedEmailParams): string {
    const lines = [
      `เรียนคุณ ${params.customerName},`,
      '',
      `รายงานการตรวจโครงการ "${params.jobTitle}" รอบที่ ${params.roundNumber} ได้รับการอนุมัติการตรวจเรียบร้อยแล้ว`,
      '',
      `เข้าสู่ระบบเพื่อดูรายละเอียด: ${params.portalUrl}`,
    ];
    if (params.pdfUrl) {
      lines.push(`ดาวน์โหลดรายงาน PDF: ${params.pdfUrl}`);
    }
    lines.push('', '— ทีมงาน HIDS');
    return lines.join('\n');
  }

  private buildRoundApprovedHtml(params: RoundApprovedEmailParams): string {
    const pdfButton = params.pdfUrl
      ? `<a href="${params.pdfUrl}" style="display:inline-block;margin:0 0 0 12px;padding:12px 28px;border:1px solid #1976d2;border-radius:6px;color:#1976d2;font-size:14px;font-weight:600;text-decoration:none;">ดาวน์โหลด PDF</a>`
      : '';

    return `
<div style="background-color:#f4f6f8;padding:32px 16px;font-family:'Inter','Noto Sans Thai',-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8eb;">
    <tr>
      <td style="background-color:#1976d2;padding:20px 28px;">
        <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.04em;">HIDS</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 8px;">
        <span style="display:inline-block;background-color:#e6f7ec;color:#21ba45;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">อนุมัติแล้ว</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 28px 0;color:#1d1d1d;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 16px;">เรียนคุณ ${params.customerName},</p>
        <p style="margin:0 0 24px;">
          รายงานการตรวจโครงการ <strong>${params.jobTitle}</strong>
          รอบที่ <strong>${params.roundNumber}</strong> ได้รับการอนุมัติการตรวจเรียบร้อยแล้ว
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${params.portalUrl}" style="display:inline-block;padding:12px 28px;background-color:#1976d2;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">เข้าสู่ระบบเพื่อดูรายละเอียด</a>${pdfButton}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;background-color:#fafbfc;border-top:1px solid #e6e8eb;color:#8a8f98;font-size:12px;line-height:1.6;">
        อีเมลนี้ส่งอัตโนมัติจากระบบ HIDS กรุณาอย่าตอบกลับอีเมลฉบับนี้
      </td>
    </tr>
  </table>
</div>
    `;
  }
}
