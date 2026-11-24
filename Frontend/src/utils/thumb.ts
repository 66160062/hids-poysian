// รูปต้นฉบับใน Storage กว้างถึง 1920px แต่ในรายการแสดงแค่ไม่กี่ร้อย px บนมือถือ
// ขอรูปย่อจาก backend (GET /images/thumb ย่อครั้งเดียวแล้วเก็บไว้ใน Storage) โหลดเร็วกว่าหลายเท่า
// ใช้ตรรกะเดียวกับ resolveImageUrl ใน DefectReport.vue

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/';

// ต้องตรงกับ ALLOWED_THUMB_WIDTHS ฝั่ง backend (storage.service.ts)
export type ThumbWidth = 400 | 600;

export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^(https?:|data:|blob:)/.test(path) ? path : `${apiUrl}${path}`;
}

// รูปที่ยังไม่อยู่ใน Storage (blob: ตอนกำลังบันทึก, path เก่า) ใช้ URL เดิม
export function thumbUrl(path: string | null | undefined, width: ThumbWidth = 400): string | null {
  const resolved = resolveImageUrl(path);
  if (!resolved || !resolved.includes(STORAGE_PUBLIC_PREFIX)) return resolved;
  return `${apiUrl}/images/thumb?w=${width}&src=${encodeURIComponent(resolved)}`;
}
