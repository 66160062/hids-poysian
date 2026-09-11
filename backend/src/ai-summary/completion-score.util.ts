/*
 * สูตรคำนวณ % ความสมบูรณ์ของบ้าน — ตายตัวทั้งหมด ไม่ให้ AI คิดเลขเอง
 * (AI มีหน้าที่แค่เรียบเรียงข้อความรอบตัวเลขที่ได้จากไฟล์นี้)
 *
 * คะแนนรวมมาจาก 2 ส่วนถ่วงน้ำหนักกัน:
 *   1) defectScore — จาก defect ที่พบ ถ่วงด้วย ความรุนแรง x ความสำคัญของหมวดงาน x สถานะการซ่อม
 *      แล้วหารด้วย "ขนาดบ้าน" (scope) เพื่อให้เทียบกันได้ระหว่างบ้านหลังใหญ่กับคอนโดห้องเล็ก
 *   2) systemScore — จากผลตรวจระบบท้ายเล่ม (inspection_summary_item) เช่น งานระบบไฟฟ้า / ประปาและสุขาภิบาล
 *      ว่าผ่านกี่รายการจากที่ประเมินทั้งหมด
 *
 * เหตุผลที่ต้องมีส่วนที่ 2: defect เป็นการ "พบจุดที่ผิด" อย่างเดียว ถ้าดูแค่ defect บ้านที่ยังไม่ได้ติดตั้ง
 * ระบบไฟฟ้า/ประปาเลยจะได้คะแนนสูงผิดความจริง เพราะไม่มี defect ให้พบตั้งแต่แรก
 */

// ── ความรุนแรงของ defect ────────────────────────────────────────────
// UI ให้เลือกแค่ Minor/Major เท่านั้น (ดู Frontend/src/pages/AddDefectPage.vue) ไม่มีระดับอื่น
export const SEVERITY_WEIGHT: Record<string, number> = {
  Major: 3,
  Minor: 1,
};
// severity ที่ไม่รู้จักถือเป็น Major ไว้ก่อน (ประเมินเข้มไว้ปลอดภัยกว่าประเมินหลวม)
const DEFAULT_SEVERITY_WEIGHT = 3;

// ── สถานะการซ่อม ───────────────────────────────────────────────────
// rejected = ซ่อมแล้วแต่ไม่ผ่าน ยังเป็นปัญหาเต็มๆ เท่ากับที่ยังไม่ได้ซ่อม
// repaired = ผู้รับเหมาแจ้งซ่อมแล้วแต่ผู้ตรวจยังไม่ยืนยัน จึงหักบางส่วน
// verified = ยืนยันแล้วว่าซ่อมผ่าน เหลือหักน้อยมากเพื่อให้ยังต่างจากบ้านที่ไม่เคยมี defect เลย
export const STATUS_MULTIPLIER: Record<string, number> = {
  pending_repair: 1,
  rejected: 1,
  repaired: 0.4,
  verified: 0.05,
};
const DEFAULT_STATUS_MULTIPLIER = 1;

// ── ความสำคัญของหมวดงาน ────────────────────────────────────────────
// defect หมวดโครงสร้าง/ไฟฟ้า/ประปา กระทบความปลอดภัยและการอยู่อาศัยมากกว่าหมวดงานตกแต่ง
// จับคู่ด้วย keyword เพราะ defect_category มี 71 หมวดและเพิ่มได้เรื่อยๆ (แมปทีละอันไม่ไหว)
export const CRITICALITY_CRITICAL = 1.6;
export const CRITICALITY_STANDARD = 1;
export const CRITICALITY_COSMETIC = 0.5;

// งานที่กระทบโครงสร้าง ความปลอดภัย หรือระบบหลักของบ้าน
const CRITICAL_KEYWORDS = [
  'โครงสร้าง',
  'ฐานราก',
  'หลังคา',
  'บันได',
  'ราวกันตก',
  'ไฟฟ้า',
  'ปลั๊ก',
  'Ground rod',
  'Juntion Box',
  'สปริงเกอร์',
  'ประปา',
  'สุขาภิบาล',
  'บ่อบำบัด',
  'บ่อดักไขมัน',
  'ปั๊มน้ำ',
  'น้ำอุ่น',
  'ปลวก',
  'FD/RD',
];

// งานตกแต่ง/ของประกอบ ที่ไม่กระทบการอยู่อาศัยโดยตรง
// ตรวจหลัง CRITICAL เสมอ เช่น 'บัวฝ้าเพดาน' ต้องเข้าพวก 'บัว' (ตกแต่ง) ไม่ใช่ 'ฝ้าเพดาน' (ทั่วไป)
const COSMETIC_KEYWORDS = [
  'บัว',
  'ผ้าม่าน',
  'มู่ลี่',
  'ม่านม้วน',
  'วอลล์เปเปอร์',
  'เฟอร์นิเจอร์',
  'เหล็กตกแต่ง',
  'ตู้จดหมาย',
  'ถังขยะ',
  'มุ้งลวด',
  'Door stopper',
  'สวน และบริเวณ',
];

export function categoryCriticality(
  categoryName: string | null | undefined,
): number {
  const name = categoryName ?? '';
  if (CRITICAL_KEYWORDS.some((k) => name.includes(k)))
    return CRITICALITY_CRITICAL;
  if (COSMETIC_KEYWORDS.some((k) => name.includes(k)))
    return CRITICALITY_COSMETIC;
  return CRITICALITY_STANDARD;
}

// ── ขนาดบ้าน (scope) ───────────────────────────────────────────────
// ใช้เทียบว่า defect ที่พบ "เยอะ" หรือ "น้อย" เมื่อเทียบกับขนาดบ้าน —
// defect 1 จุดในบ้าน 200 ตร.ม. ควรกระทบคะแนนน้อยกว่า defect 1 จุดในห้อง 30 ตร.ม.
// ขั้นต่ำไว้กันกรณีข้อมูลขนาดบ้านหาย/เป็น 0 แล้วหารกันจนคะแนนเพี้ยน
export const MIN_SCOPE = 8;

export function computeScope(
  usableArea: number | null | undefined,
  floorCount: number | null | undefined,
): number {
  const area = usableArea && usableArea > 0 ? usableArea : 0;
  const floors = floorCount && floorCount > 0 ? floorCount : 1;
  return Math.max(MIN_SCOPE, area / 10 + floors * 2);
}

// defect load ต่อ 1 หน่วย scope ที่ถือว่าบ้าน "ไม่สมบูรณ์เลย" (defectScore = 0)
// เทียบจากข้อมูลจริง: บ้าน 135 ตร.ม. 2 ชั้น มี scope 17.5 → ต้องมี load ~96
// ซึ่งประมาณ defect ระดับ Major หมวดโครงสร้าง 20 จุดที่ยังไม่ได้ซ่อม
//
// ตั้งไว้สูงพอให้ช่วงคะแนนที่ใช้งานจริงกระจายตัวดี — จากข้อมูลจริงรอบตรวจหนึ่งมี defect
// มากสุด 14 จุด ถ้าตั้งต่ำกว่านี้บ้านที่ "มีปัญหาเยอะแต่ยังอยู่ได้" จะได้คะแนนเข้าใกล้ 0
// ซึ่งสื่อผิดว่าบ้านแทบสร้างไม่เสร็จ
export const ZERO_SCORE_LOAD_PER_SCOPE = 5.5;

// เพดานคะแนนเมื่อยังมีงานค้าง — กันไม่ให้รายงานขึ้น 100% ทั้งที่ยังมี defect รอซ่อม
// หรือมีรายการตรวจระบบไม่ผ่านอยู่ (100% ต้องแปลว่า "ไม่มีอะไรค้างแล้ว" เท่านั้น)
export const OUTSTANDING_WORK_CAP = 99;

// สถานะที่ถือว่ายังเป็นงานค้างอยู่จริง (ซ่อมแล้วรอตรวจ/ตรวจผ่านแล้ว ไม่นับ)
const OUTSTANDING_STATUSES = ['pending_repair', 'rejected'];

// ── สัดส่วนถ่วงน้ำหนักคะแนนรวม ──────────────────────────────────────
// ให้ defect มีน้ำหนักมากกว่าเพราะเป็นข้อมูลละเอียดรายจุด ส่วนผลตรวจระบบเป็นภาพรวมรายหมวด
export const DEFECT_SCORE_WEIGHT = 0.6;
export const SYSTEM_SCORE_WEIGHT = 0.4;

// ── ผลตรวจระบบท้ายเล่ม ─────────────────────────────────────────────
export type SummaryVerdict = 'pass' | 'fail' | 'descriptive';

/*
 * แยกว่าตัวเลือกที่ผู้ตรวจเลือกไว้เป็น "การประเมิน" (ผ่าน/ไม่ผ่าน) หรือแค่ "คำอธิบาย"
 * ต้องเช็คตามลำดับนี้เท่านั้น เพราะข้อความภาษาไทยซ้อนกันเอง:
 *   'ยังไม่พร้อมเข้าอยู่อาศัย' มีคำว่า 'พร้อมเข้าอยู่อาศัย' อยู่ข้างใน
 *   'ไม่พบปัญหาน้ำขัง' มีคำว่า 'พบปัญหา' อยู่ข้างใน
 * ตัวเลือกเชิงคำอธิบาย (ทิศทางบ้าน, ผนังก่ออิฐ/ผนังเบา, 100/150 แอมป์) จะตกมาที่ 'descriptive'
 * และไม่ถูกนำมาคิดคะแนน
 */
export function classifySummaryOption(
  optionValue: string | null | undefined,
): SummaryVerdict {
  const value = (optionValue ?? '').trim();
  if (!value) return 'descriptive';

  if (value.includes('ยังไม่')) return 'fail';
  if (value.includes('ไม่พบปัญหา')) return 'pass';
  if (value.includes('พบปัญหา')) return 'fail';
  if (
    value.includes('ติดตั้งเรียบร้อย') ||
    value.includes('ตรวจสอบครบทุกจุด') ||
    value.includes('พร้อมเข้าอยู่อาศัย')
  ) {
    return 'pass';
  }
  return 'descriptive';
}

// ── Input / Output ─────────────────────────────────────────────────
export interface ScoredDefect {
  severity: string;
  status: string;
  // ชื่อหมวดงานทุกหมวดที่ defect จุดนี้ผูกอยู่ — ใช้หมวดที่สำคัญที่สุดเป็นตัวตัดสิน
  categoryNames: string[];
}

export interface ScoredSummaryItem {
  category: string;
  label: string;
  optionValue: string;
}

export interface FailedSystem {
  category: string;
  label: string;
  value: string;
}

export interface CompletionScore {
  /** คะแนนรวมที่โชว์ให้ลูกค้า 0-100 */
  percent: number;
  /** คะแนนส่วน defect 0-100 */
  defectScore: number;
  /** คะแนนส่วนผลตรวจระบบ 0-100 — null เมื่อรอบนี้ยังไม่ได้กรอกผลตรวจระบบเลย */
  systemScore: number | null;
  /** ค่าถ่วงน้ำหนักรวมของ defect ทั้งหมด (ยิ่งมากยิ่งแย่) ใช้ debug/อธิบายที่มาของคะแนน */
  defectLoad: number;
  /** ขนาดบ้านที่ใช้หาร */
  scope: number;
  /** จำนวนรายการตรวจระบบที่ประเมินได้ (ไม่นับตัวเลือกเชิงคำอธิบาย) */
  systemAssessedCount: number;
  systemPassedCount: number;
  /** รายการตรวจระบบที่ไม่ผ่าน — ส่งให้ AI พูดถึงได้ตรงจุด */
  failedSystems: FailedSystem[];
}

export interface CompletionScoreInput {
  defects: ScoredDefect[];
  summaryItems: ScoredSummaryItem[];
  usableArea: number | null | undefined;
  floorCount: number | null | undefined;
}

export function computeCompletionScore(
  input: CompletionScoreInput,
): CompletionScore {
  const scope = computeScope(input.usableArea, input.floorCount);

  const defectLoad = input.defects.reduce((sum, d) => {
    const severity = SEVERITY_WEIGHT[d.severity] ?? DEFAULT_SEVERITY_WEIGHT;
    const status = STATUS_MULTIPLIER[d.status] ?? DEFAULT_STATUS_MULTIPLIER;
    // defect หนึ่งจุดผูกได้หลายหมวด ใช้หมวดที่สำคัญที่สุดเป็นตัวตัดสิน
    const criticality = Math.max(
      ...d.categoryNames.map(categoryCriticality),
      CRITICALITY_STANDARD,
    );
    return sum + severity * status * criticality;
  }, 0);

  const zeroScoreLoad = scope * ZERO_SCORE_LOAD_PER_SCOPE;
  const defectScore = 100 * (1 - Math.min(1, defectLoad / zeroScoreLoad));

  // ── ผลตรวจระบบ ──
  let assessedWeight = 0;
  let passedWeight = 0;
  let systemAssessedCount = 0;
  let systemPassedCount = 0;
  const failedSystems: FailedSystem[] = [];

  for (const item of input.summaryItems) {
    const verdict = classifySummaryOption(item.optionValue);
    if (verdict === 'descriptive') continue;

    const weight = categoryCriticality(item.category);
    assessedWeight += weight;
    systemAssessedCount += 1;

    if (verdict === 'pass') {
      passedWeight += weight;
      systemPassedCount += 1;
    } else {
      failedSystems.push({
        category: item.category,
        label: item.label,
        value: item.optionValue,
      });
    }
  }

  const systemScore =
    assessedWeight > 0 ? 100 * (passedWeight / assessedWeight) : null;

  // ยังไม่ได้กรอกผลตรวจระบบเลย (เช่นงานตรวจก่อสร้างที่ข้ามขั้นตอนนี้) → ใช้คะแนน defect ล้วน
  const rawPercent =
    systemScore === null
      ? defectScore
      : DEFECT_SCORE_WEIGHT * defectScore + SYSTEM_SCORE_WEIGHT * systemScore;

  // ปัดเศษก่อนแล้วค่อยกดเพดาน เพื่อไม่ให้ 99.6 ที่ยังมีงานค้างถูกปัดขึ้นเป็น 100
  const hasOutstandingWork =
    input.defects.some((d) => OUTSTANDING_STATUSES.includes(d.status)) ||
    failedSystems.length > 0;
  const percent = hasOutstandingWork
    ? Math.min(OUTSTANDING_WORK_CAP, clampPercent(rawPercent))
    : clampPercent(rawPercent);

  return {
    percent,
    defectScore: clampPercent(defectScore),
    systemScore: systemScore === null ? null : clampPercent(systemScore),
    defectLoad: Math.round(defectLoad * 100) / 100,
    scope: Math.round(scope * 10) / 10,
    systemAssessedCount,
    systemPassedCount,
    failedSystems,
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
