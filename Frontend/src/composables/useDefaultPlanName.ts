import { i18n } from 'src/boot/i18n';

// ชื่อแปลนอัตโนมัติ (ตอนไม่กรอกชื่อเอง) ต้องได้ทั้งสองภาษาเสมอไม่ว่า UI ตอนสร้างจะใช้ locale ไหน —
// เดิมเรียก t('components.planPosition.defaultPlanName', {n}) ตรงๆ ซึ่งผูกกับ locale ปัจจุบันของคนสร้าง
// ทำให้ name ที่เซฟลง DB ติดเป็นอังกฤษถาวรถ้าคนสร้างตอนนั้นสลับ UI เป็นอังกฤษไว้ พอดู PDF ภาษาไทยทีหลังเลยโผล่เป็นอังกฤษ
export function defaultPlanNames(n: number): { th: string; en: string } {
  return {
    th: i18n.global.t('components.planPosition.defaultPlanName', { n }, { locale: 'th-TH' }),
    en: i18n.global.t('components.planPosition.defaultPlanName', { n }, { locale: 'en-US' }),
  };
}
