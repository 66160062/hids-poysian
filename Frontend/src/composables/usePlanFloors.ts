import { isAxiosError } from 'axios';
import type { HousePlan } from 'src/models';
import type { SelectOption } from 'src/stores/useInspection';
import { localizedText } from 'src/composables/useLocalizedField';

// ชื่อแปลนที่โชว์ = แปลน{ชื่อชั้น} ตามชั้นที่ผูกไว้; แปลนเก่าที่ยังไม่มีชั้น (floor = null) ใช้ชื่อที่เก็บไว้เดิม
export function planDisplayName(plan: Pick<HousePlan, 'name' | 'nameEn' | 'floor'>): string {
  if (plan.floor) {
    return localizedText(`แปลน${plan.floor.label}`, plan.floor.labelEn ? `${plan.floor.labelEn} Plan` : null);
  }
  return localizedText(plan.name, plan.nameEn);
}

// ชั้นที่เลือกได้ตอนเพิ่ม/ย้ายแปลน: ตัด "ชั้นอื่นๆ" ออก (แปลนต้องผูกชั้นจริง) และตัดชั้นที่แปลนอื่นของงานใช้แล้ว
export function availablePlanFloors(
  floors: SelectOption[],
  plans: { planId?: number; floor?: { floorId: number } | null }[],
  currentPlanId?: number,
): SelectOption[] {
  const taken = new Set<number>();
  for (const p of plans) {
    if (p.floor && (currentPlanId === undefined || p.planId !== currentPlanId)) taken.add(p.floor.floorId);
  }
  return floors.filter((f) => !f.isOther && !taken.has(f.value));
}

// 409 จาก backend = งานนี้มีแปลนอยู่ในชั้นนั้นแล้ว
export function isFloorTakenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}
