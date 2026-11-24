// โมเดลฟอร์มรายงานก่อสร้างประจำวัน + ฟังก์ชันแปลงไป/กลับ API payload
// แยกจากหน้าจอเพื่อให้ทุก step ใช้ state เดียวกัน และเก็บเป็นฉบับร่างได้ (ทุกฟิลด์เป็น JSON ล้วน)
import type {
  ConstructionDailyReportPayload,
  ConstructionDailyReportResponse,
  MachinePayload,
  PersonnelPayload,
  PreviousRoundCrew,
  WorkItemPayload,
} from 'src/stores/useConstructionDailyReport';

export type CrewType = 'PERSONNEL' | 'WORKER';

export interface WorkEntry {
  id: string;
  name: string;
  location: string;
  unit: string;
  actual: number | null;
  /** % ของรอบก่อน (เฉพาะงานที่ดึงต่อมาจากรอบก่อน) */
  previousPercent?: number;
  /** งานที่ดึงมาจากรอบก่อนและยังไม่ได้อัปเดต % ของวันนี้ */
  needsUpdate?: boolean;
}

export interface CrewEntry {
  id: string;
  name: string;
  type: CrewType;
  count: number;
  hours: number | null;
}

export interface MachineEntry {
  id: string;
  name: string;
  size: string;
  quantity: number;
  hours: number | null;
}

export interface IssueEntry {
  id: string;
  text: string;
  status: string;
}

export interface ReportForm {
  startTime: string;
  endTime: string;
  weather: string;
  works: WorkEntry[];
  crew: CrewEntry[];
  machines: MachineEntry[];
  /** 0 = ไม่มีอุบัติเหตุ */
  accidentCount: number;
  issues: IssueEntry[];
}

export interface ReportPhoto {
  id: string;
  /** null = รูปพาโนรามา หรือรูปทั่วไป */
  workId: string | null;
  file: File;
  preview: string;
}

export const DEFAULT_START_TIME = '08:00';
export const DEFAULT_END_TIME = '17:00';
export const DEFAULT_HOURS = 8;

// ค่าที่บันทึกลงฐานข้อมูลเป็นข้อความไทยตามเดิม (PDF อ่านค่านี้) — แปลเฉพาะ label ตอนแสดง
export const ISSUE_STATUS_VALUES = ['ติดตามผล', 'รอดำเนินการ', 'รับทราบแล้ว'] as const;
export const ACCIDENT_DESCRIPTION = 'เกิดอุบัติเหตุ/ผู้บาดเจ็บ';

export const WEATHER_VALUES = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'] as const;

export const PERSONNEL_TYPES = [
  'ผู้จัดการโครงการ', 'วิศวกรโครงการ', 'ประสานงานโครงการ', 'วิศวกรสนาม', 'สถาปนิก',
  'โฟร์แมนโครงสร้าง', 'โฟร์แมนสถาปัตย์', 'จนท.ความปลอดภัย', 'ช่างสำรวจ', 'เสมียน',
  'พนักงานคุมสโตร์', 'พนักงานควบคุมเครื่องจักร', 'พนักงานขับรถ',
];

export const WORKER_TYPES = [
  'หัวหน้าชุด', 'ช่างไม้', 'ช่างปูนก่อ, เท Topping', 'ช่างปูนฉาบ', 'ช่างกระเบื้อง',
  'ช่างฝ้าเพดาน', 'ช่างติดตั้ง, สุขภัณฑ์', 'ช่างทาสี', 'กรรมกร (ชาย/หญิง)',
  'ช่างเฟอร์นิเจอร์', 'ช่างไฟ', 'ช่างเหล็ก, ช่างเชื่อม', 'ช่างแอร์',
];

// value = ข้อความไทยที่บันทึก, key = i18n key ใต้ construction.inspect.roomOptions / unitOptions
export const ROOM_OPTION_KEYS: Record<string, string> = {
  ห้องรับแขก: 'livingRoom',
  ห้องนอน: 'bedroom',
  ห้องน้ำ: 'bathroom',
  ห้องครัว: 'kitchen',
  ระเบียง: 'balcony',
  รอบตัวบ้าน: 'exterior',
  หลังคา: 'roof',
  ส่วนกลาง: 'commonArea',
};
export const UNIT_OPTION_KEYS: Record<string, string> = {
  'ตร.ม.': 'sqm',
  เมตร: 'meter',
  ชิ้น: 'piece',
  จุด: 'point',
  ชุด: 'set',
};

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyForm(): ReportForm {
  return {
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    weather: 'Sunny',
    works: [],
    crew: [],
    machines: [],
    accidentCount: 0,
    issues: [],
  };
}

export function splitWorkingPeriod(period?: string | null): { start: string; end: string } | null {
  if (!period) return null;
  const [start, end] = period.split(' - ').map((s) => s.trim());
  if (!start || !end) return null;
  return { start, end };
}

/** งานจากรอบก่อนที่ยังไม่ถึง 100% → ต้องอัปเดต % ของวันนี้ */
export function worksFromPrevious(items: WorkItemPayload[]): WorkEntry[] {
  return items.map((item) => ({
    id: newId(),
    name: item.description,
    location: item.location || '',
    unit: item.unit || '',
    actual: null,
    previousPercent: item.actualPercent || 0,
    needsUpdate: true,
  }));
}

// คอลัมน์ decimal ของ Postgres กลับมาเป็น string (เช่น "8.00") จึงต้องแปลงเป็นตัวเลขก่อนใช้
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function crewFromPayload(personnels: PersonnelPayload[]): CrewEntry[] {
  return personnels.map((p) => ({
    id: newId(),
    name: p.name,
    type: p.type,
    count: toNumberOrNull(p.count) ?? 1,
    hours: toNumberOrNull(p.hours),
  }));
}

export function machinesFromPayload(machines: MachinePayload[]): MachineEntry[] {
  return machines.map((m) => ({
    id: newId(),
    // machineName อาจว่างในรายงานเก่า (หลังบ้านยังไม่เก็บชื่อเครื่องจักร) — หน้าจอแสดงชื่อสำรองแทน
    name: m.machineName || '',
    size: m.machineSize || '',
    quantity: toNumberOrNull(m.quantity) ?? 1,
    hours: toNumberOrNull(m.workingHours),
  }));
}

/** แปลงรายงานที่มีอยู่แล้วบนเซิร์ฟเวอร์ (โหมดแก้ไข) เป็น state ของฟอร์ม — ยังไม่รวมรูป */
export function formFromReport(report: ConstructionDailyReportResponse): ReportForm {
  const form = emptyForm();
  const period = splitWorkingPeriod(report.workingPeriod);
  if (period) {
    form.startTime = period.start;
    form.endTime = period.end;
  }
  if (report.weather) form.weather = report.weather;
  form.works = (report.workItems ?? []).map((item) => ({
    id: newId(),
    name: item.description,
    location: item.location || '',
    unit: item.unit || '',
    actual: item.actualPercent ?? 0,
  }));
  form.crew = crewFromPayload(report.personnels ?? []);
  form.machines = machinesFromPayload(report.machines ?? []);
  form.issues = (report.issues ?? []).map((issue) => ({
    id: newId(),
    text: issue.description,
    status: issue.note || ISSUE_STATUS_VALUES[0],
  }));
  form.accidentCount = (report.accidents ?? []).reduce((sum, a) => sum + (a.accidentCount || 1), 0);
  return form;
}

/** ใช้ข้อมูลทีม/เครื่องจักร/ช่วงเวลาจากรอบก่อน (แทนที่ของเดิม) */
export function applyPreviousCrew(form: ReportForm, prev: PreviousRoundCrew): void {
  form.crew = crewFromPayload(prev.personnels ?? []);
  form.machines = machinesFromPayload(prev.machines ?? []);
  const period = splitWorkingPeriod(prev.workingPeriod);
  if (period) {
    form.startTime = period.start;
    form.endTime = period.end;
  }
}

// ── Validation ────────────────────────────────────────────────

export type StepKey = 'general' | 'work' | 'crew' | 'safety' | 'photos' | 'review';

export interface ReportProblem {
  step: StepKey;
  /** i18n key ใต้ construction.report.problems */
  key: string;
  params?: Record<string, string | number>;
  /** blocking = ส่งไม่ได้จนกว่าจะแก้ / warning = ส่งได้ แต่ควรเติม */
  level: 'blocking' | 'warning';
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateReport(form: ReportForm, hasPanorama: boolean): ReportProblem[] {
  const problems: ReportProblem[] = [];
  if (!form.startTime || !form.endTime) {
    problems.push({ step: 'general', key: 'timeMissing', level: 'blocking' });
  } else if (!TIME_RE.test(form.startTime) || !TIME_RE.test(form.endTime)) {
    problems.push({ step: 'general', key: 'timeFormat', level: 'blocking' });
  } else if (form.endTime <= form.startTime) {
    problems.push({ step: 'general', key: 'timeOrder', level: 'warning' });
  }
  if (!form.weather) problems.push({ step: 'general', key: 'weatherMissing', level: 'blocking' });

  if (form.works.length === 0) {
    problems.push({ step: 'work', key: 'workMissing', level: 'blocking' });
  }
  const pending = form.works.filter((w) => w.needsUpdate || w.actual === null).length;
  if (pending > 0) {
    problems.push({ step: 'work', key: 'workPending', params: { count: pending }, level: 'blocking' });
  }

  if (form.crew.length === 0) {
    problems.push({ step: 'crew', key: 'crewMissing', level: 'warning' });
  }
  if (!hasPanorama) {
    problems.push({ step: 'photos', key: 'panoramaMissing', level: 'warning' });
  }
  return problems;
}

// ── Payload ───────────────────────────────────────────────────

export function todayIso(): string {
  // วันที่ตามเวลาเครื่อง (ไม่ใช่ UTC) — toISOString() จะได้วันก่อนหน้าถ้าส่งก่อน 07:00 น. ในไทย
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function buildPayload(roundId: number, form: ReportForm): ConstructionDailyReportPayload {
  const payload: ConstructionDailyReportPayload = {
    roundId,
    reportDate: todayIso(),
    workItems: form.works.map((w, index) => ({
      description: w.name,
      location: w.location,
      unit: w.unit,
      actualPercent: w.actual ?? 0,
      sequence: index + 1,
    })),
    // บุคลากรก่อน แล้วตามด้วยคนงาน (ลำดับเดียวกับหน้าเดิม — PDF แสดงตามลำดับนี้)
    personnels: [...form.crew.filter((c) => c.type === 'PERSONNEL'), ...form.crew.filter((c) => c.type === 'WORKER')].map(
      (c) => {
        const p: PersonnelPayload = { name: c.name, type: c.type, count: c.count };
        if (c.hours != null) p.hours = c.hours;
        return p;
      },
    ),
    issues: form.issues.map((n) => ({ description: n.text, note: n.status })),
    machines: form.machines.map((m) => {
      const p: MachinePayload = { machineName: m.name, quantity: m.quantity };
      if (m.size) p.machineSize = m.size;
      if (m.hours != null) p.workingHours = m.hours;
      return p;
    }),
    accidents:
      form.accidentCount > 0
        ? [{ description: ACCIDENT_DESCRIPTION, accidentCount: form.accidentCount }]
        : [],
  };
  if (form.weather) payload.weather = form.weather;
  if (form.startTime && form.endTime) payload.workingPeriod = `${form.startTime} - ${form.endTime}`;
  return payload;
}
