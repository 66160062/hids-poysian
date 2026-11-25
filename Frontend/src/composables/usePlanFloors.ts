import { isAxiosError } from 'axios';
import type { HousePlan } from 'src/models';
import type { SelectOption } from 'src/stores/useInspection';
import { localizedText } from 'src/composables/useLocalizedField';

// ชื่อแปลนที่โชว์ = ชื่อที่เก็บไว้ (backend ตั้งเป็น แปลน{ชื่อชั้น} ทุกครั้งที่สร้าง/ย้ายชั้น และแปลนเก่ามีชื่อเดิม เช่น "แปลนบ้าน 1")
// แปลนที่ยังไม่มีชื่อ (ไม่ควรเกิด) จึงค่อยถอยไปใช้ชื่อชั้น
export function planDisplayName(plan: Pick<HousePlan, 'name' | 'nameEn' | 'floor'>): string {
  if (!plan.name && plan.floor) {
    return localizedText(`แปลน${plan.floor.label}`, plan.floor.labelEn ? `${plan.floor.labelEn} Plan` : null);
  }
  return localizedText(plan.name, plan.nameEn);
}

// แปลนเรียงตามชั้นแบบตายตัว: รูปแรก = ชั้น 1, รูปถัดไป = ชั้น 2 ... ชั้น 10 แล้วชั้นลอย (ตาม floor_order)
// ใช้เฉพาะชั้นมาตรฐาน (มี order) ไม่รวม "อื่นๆ" และชั้นที่ผู้ตรวจพิมพ์เอง
// ถ้าลบแปลนชั้นกลางทิ้ง ช่อง "+" จะเติมชั้นที่ว่างที่ต่ำสุดก่อน คืน null เมื่อทุกชั้นมีแปลนแล้ว
export function nextPlanFloor(
  floors: SelectOption[],
  plans: { floor?: { floorId: number } | null }[],
): SelectOption | null {
  const taken = new Set(plans.flatMap((p) => (p.floor ? [p.floor.floorId] : [])));
  const standard = floors
    .filter((f) => !f.isOther && f.order != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return standard.find((f) => !taken.has(f.value)) ?? null;
}

// 409 จาก backend = งานนี้มีแปลนอยู่ในชั้นนั้นแล้ว
export function isFloorTakenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}
