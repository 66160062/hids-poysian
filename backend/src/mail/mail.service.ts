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

interface ContractorRoundApprovedEmailParams {
  to: string;
  contractorName: string;
  jobTitle: string;
  roundNumber: number;
  portalUrl: string;
}

interface InspectorAssignedEmailParams {
  to: string;
  inspectorName: string;
  jobTitle: string;
  portalUrl: string;
}

interface RoundOpenedEmailParams {
  to: string;
  inspectorName: string;
  jobTitle: string;
  roundNumber: number;
  scheduledDate: string | null;
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

  // แจ้งผู้รับเหมาเมื่อแอดมินอนุมัติรายงานรอบตรวจ — ส่งคู่กับอีเมลลูกค้า เพราะเป็นจังหวะที่
  // defect list นิ่งแล้ว (ลูกค้ายืนยันแล้ว) พร้อมให้ผู้รับเหมาเข้าไปซ่อมได้จริง
  async sendContractorRoundApprovedEmail(
    params: ContractorRoundApprovedEmailParams,
  ): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      const fromAddress = process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"HIDS" <${fromAddress}>`,
        to: params.to,
        subject: `รายงานการตรวจ "${params.jobTitle}" รอบที่ ${params.roundNumber} พร้อมให้ซ่อมแล้ว`,
        text: this.buildContractorRoundApprovedText(params),
        html: this.buildContractorRoundApprovedHtml(params),
      });
      this.logger.log(`ส่งอีเมลแจ้งผู้รับเหมาให้ ${params.to} สำเร็จ (${info.messageId})`);
    } catch (error) {
      this.logger.error(
        `ส่งอีเมลแจ้งผู้รับเหมาให้ ${params.to} ไม่สำเร็จ`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // แจ้ง inspector เมื่อถูกมอบหมายงานตรวจ — fire-and-forget เหมือน method อื่นในไฟล์นี้
  async sendInspectorAssignedEmail(
    params: InspectorAssignedEmailParams,
  ): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      const fromAddress = process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"HIDS" <${fromAddress}>`,
        to: params.to,
        subject: `คุณได้รับมอบหมายงานตรวจ "${params.jobTitle}"`,
        text: this.buildInspectorAssignedText(params),
        html: this.buildInspectorAssignedHtml(params),
      });
      this.logger.log(`ส่งอีเมลแจ้งมอบหมายงานให้ ${params.to} สำเร็จ (${info.messageId})`);
    } catch (error) {
      this.logger.error(
        `ส่งอีเมลแจ้งมอบหมายงานให้ ${params.to} ไม่สำเร็จ`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // แจ้ง inspector เมื่อเปิดรอบตรวจใหม่ — เพื่อให้รู้ว่ามีรอบใหม่ที่ต้องเข้าตรวจ
  async sendRoundOpenedEmail(params: RoundOpenedEmailParams): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      const fromAddress = process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"HIDS" <${fromAddress}>`,
        to: params.to,
        subject: `เปิดรอบตรวจใหม่ "${params.jobTitle}" รอบที่ ${params.roundNumber}`,
        text: this.buildRoundOpenedText(params),
        html: this.buildRoundOpenedHtml(params),
      });
      this.logger.log(`ส่งอีเมลแจ้งเปิดรอบตรวจให้ ${params.to} สำเร็จ (${info.messageId})`);
    } catch (error) {
      this.logger.error(
        `ส่งอีเมลแจ้งเปิดรอบตรวจให้ ${params.to} ไม่สำเร็จ`,
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
      `คลิกเพื่อดูรายละเอียด: ${params.portalUrl}`,
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
        <a href="${params.portalUrl}" style="display:inline-block;padding:12px 28px;background-color:#1976d2;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">คลิกเพื่อดูรายละเอียด</a>${pdfButton}
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

  private buildContractorRoundApprovedText(
    params: ContractorRoundApprovedEmailParams,
  ): string {
    return [
      `เรียนคุณ ${params.contractorName},`,
      '',
      `รายงานการตรวจโครงการ "${params.jobTitle}" รอบที่ ${params.roundNumber} ได้รับการอนุมัติแล้ว`,
      `รายการ defect พร้อมให้เข้าไปดำเนินการซ่อมแล้ว`,
      '',
      `คลิกเพื่อดูรายละเอียด: ${params.portalUrl}`,
      '',
      '— ทีมงาน HIDS',
    ].join('\n');
  }

  private buildContractorRoundApprovedHtml(
    params: ContractorRoundApprovedEmailParams,
  ): string {
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
        <span style="display:inline-block;background-color:#fff4e5;color:#f2711c;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">พร้อมซ่อม</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 28px 0;color:#1d1d1d;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 16px;">เรียนคุณ ${params.contractorName},</p>
        <p style="margin:0 0 24px;">
          รายงานการตรวจโครงการ <strong>${params.jobTitle}</strong>
          รอบที่ <strong>${params.roundNumber}</strong> ได้รับการอนุมัติแล้ว
          รายการ defect พร้อมให้เข้าไปดำเนินการซ่อมแล้ว
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${params.portalUrl}" style="display:inline-block;padding:12px 28px;background-color:#1976d2;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">คลิกเพื่อดำเนินการซ่อม</a>
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

  private buildInspectorAssignedText(
    params: InspectorAssignedEmailParams,
  ): string {
    return [
      `เรียนคุณ ${params.inspectorName},`,
      '',
      `คุณได้รับมอบหมายให้เป็นผู้ตรวจในงาน "${params.jobTitle}"`,
      '',
      `คลิกเพื่อดูรายละเอียด: ${params.portalUrl}`,
      '',
      '— ทีมงาน HIDS',
    ].join('\n');
  }

  private buildInspectorAssignedHtml(
    params: InspectorAssignedEmailParams,
  ): string {
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
        <span style="display:inline-block;background-color:#e8f0fe;color:#1976d2;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">มอบหมายงานใหม่</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 28px 0;color:#1d1d1d;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 16px;">เรียนคุณ ${params.inspectorName},</p>
        <p style="margin:0 0 24px;">
          คุณได้รับมอบหมายให้เป็นผู้ตรวจในงาน <strong>${params.jobTitle}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${params.portalUrl}" style="display:inline-block;padding:12px 28px;background-color:#1976d2;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">คลิกเพื่อดูรายละเอียด</a>
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

  private buildRoundOpenedText(params: RoundOpenedEmailParams): string {
    const lines = [
      `เรียนคุณ ${params.inspectorName},`,
      '',
      `เปิดรอบตรวจใหม่สำหรับงาน "${params.jobTitle}" รอบที่ ${params.roundNumber}`,
    ];
    if (params.scheduledDate) {
      lines.push(`วันที่นัดหมาย: ${params.scheduledDate}`);
    }
    lines.push('', `คลิกเพื่อดูรายละเอียด: ${params.portalUrl}`, '', '— ทีมงาน HIDS');
    return lines.join('\n');
  }

  private buildRoundOpenedHtml(params: RoundOpenedEmailParams): string {
    const scheduledRow = params.scheduledDate
      ? `<p style="margin:0 0 24px;">วันที่นัดหมาย: <strong>${params.scheduledDate}</strong></p>`
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
        <span style="display:inline-block;background-color:#e8f0fe;color:#1976d2;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">เปิดรอบตรวจใหม่</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 28px 0;color:#1d1d1d;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 16px;">เรียนคุณ ${params.inspectorName},</p>
        <p style="margin:0 0 8px;">
          เปิดรอบตรวจใหม่สำหรับงาน <strong>${params.jobTitle}</strong> รอบที่ <strong>${params.roundNumber}</strong>
        </p>
        ${scheduledRow}
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;">
        <a href="${params.portalUrl}" style="display:inline-block;padding:12px 28px;background-color:#1976d2;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">คลิกเพื่อดูรายละเอียด</a>
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
