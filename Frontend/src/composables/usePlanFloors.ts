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

// ชั้นที่เลือกได้ตอนเพิ่ม/ย้ายแปลน: ตัด "ชั้นอื่นๆ" ออก (แปลนต้องผูกชั้นจริง) และตัดชั้นที่แปลนอื่นของงานใช้แล้ว
// ownFloor = ชั้นปัจจุบันของแปลนที่กำลังแก้ ต้องอยู่ในตัวเลือกเสมอ (แปลนเก่าอาจใช้ชั้นซ้ำกัน/เป็น "ชั้นอื่นๆ"/ชั้นที่พิมพ์เอง)
// ไม่งั้น q-select (emit-value map-options) จะโชว์ floorId ดิบ
export function availablePlanFloors(
  floors: SelectOption[],
  plans: { planId?: number; floor?: { floorId: number } | null }[],
  currentPlanId?: number,
  ownFloor?: { floorId: number; label: string } | null,
): SelectOption[] {
  const taken = new Set<number>();
  for (const p of plans) {
    if (p.floor && (currentPlanId === undefined || p.planId !== currentPlanId)) taken.add(p.floor.floorId);
  }
  const result = floors.filter((f) => !f.isOther && !taken.has(f.value) && f.value !== ownFloor?.floorId);
  if (!ownFloor) return result;
  const own = floors.find((f) => f.value === ownFloor.floorId) ?? { value: ownFloor.floorId, label: ownFloor.label };
  // คงลำดับตามรายการชั้นเดิม
  return floors.length ? [...result, own].sort((a, b) => floorIndex(floors, a.value) - floorIndex(floors, b.value)) : [own];
}

const floorIndex = (floors: SelectOption[], id: number) => {
  const i = floors.findIndex((f) => f.value === id);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

// 409 จาก backend = งานนี้มีแปลนอยู่ในชั้นนั้นแล้ว
export function isFloorTakenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}
