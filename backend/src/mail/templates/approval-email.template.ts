/**
 * HTML Email Template สำหรับแจ้งผลการอนุมัติรายงานตรวจบ้าน
 * ใช้ inline CSS เพื่อ compatibility กับ Email clients ทุกตัว
 */

export interface ApprovalEmailData {
  customerName: string;
  projectName: string;
  roundNumber: number;
  tokenUrl: string;
}

export function buildApprovalEmailHtml(data: ApprovalEmailData): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานตรวจบ้านผ่านการอนุมัติ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%); padding: 40px 32px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 8px;">🏠</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 2px;">POYSIAN</h1>
              <p style="margin: 4px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">บริการตรวจบ้าน ตรวจคอนโด ครบวงจร</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 12px; border: 1px solid #c8e6c9;">
                <tr>
                  <td style="padding: 16px 20px; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 4px;">✅</div>
                    <div style="color: #2e7d32; font-size: 16px; font-weight: 700;">ผ่านการอนุมัติแล้ว</div>
                    <div style="color: #388e3c; font-size: 13px; margin-top: 4px;">รายงานตรวจบ้านของคุณได้รับการอนุมัติเรียบร้อยแล้ว</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px 32px;">
              <p style="margin: 0 0 16px; color: #37474f; font-size: 15px; line-height: 1.6;">
                สวัสดีครับ/ค่ะ <strong style="color: #1565c0;">${data.customerName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #546e7a; font-size: 14px; line-height: 1.6;">
                ทางทีมตรวจบ้าน POYSIAN ขอแจ้งให้ทราบว่ารายงานตรวจบ้านของคุณได้ผ่านการอนุมัติแล้ว
                คุณสามารถดูรายละเอียดรายงานได้ตามลิงก์ด้านล่าง
              </p>

              <!-- Info Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #78909c; font-size: 13px; width: 120px;">โครงการ</td>
                        <td style="padding: 6px 0; color: #263238; font-size: 14px; font-weight: 600;">${data.projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78909c; font-size: 13px;">รอบตรวจ</td>
                        <td style="padding: 6px 0; color: #263238; font-size: 14px; font-weight: 600;">ครั้งที่ ${data.roundNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78909c; font-size: 13px;">สถานะ</td>
                        <td style="padding: 6px 0;">
                          <span style="display: inline-block; background-color: #4caf50; color: white; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">อนุมัติแล้ว</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${data.tokenUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(25, 118, 210, 0.35);">
                      📄 ดูรายงานออนไลน์
                    </a>
                  </td>
                </tr>
              </table>

              <!-- PDF Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; color: #1565c0; font-size: 13px; line-height: 1.5;">
                      📎 <strong>ไฟล์ PDF รายงาน</strong> ได้ถูกแนบมาพร้อมกับอีเมลนี้แล้ว คุณสามารถดาวน์โหลดและเก็บไว้เป็นหลักฐานได้เลย
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #263238; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; color: #b0bec5; font-size: 12px;">
                © 2026, POYSIAN รับตรวจบ้าน ตรวจคอนโด
              </p>
              <p style="margin: 0; color: #78909c; font-size: 11px;">
                📞 098-765-4321 &nbsp;&nbsp;|&nbsp;&nbsp; 📧 poysian@gmail.com &nbsp;&nbsp;|&nbsp;&nbsp; LINE: @poysian
              </p>
              <p style="margin: 8px 0 0; color: #546e7a; font-size: 10px; line-height: 1.4;">
                อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ POYSIAN กรุณาอย่าตอบกลับอีเมลนี้<br>
                หากมีข้อสงสัย กรุณาติดต่อทีมงานโดยตรง
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
