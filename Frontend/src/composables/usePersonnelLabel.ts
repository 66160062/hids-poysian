import { useI18n } from 'vue-i18n';

// Personnel/worker position names come from a fixed, closed dropdown list
// (see ConstructionInspectPage.vue's personnelOptions/workerOptions) that is
// saved verbatim as Thai text — same static-dictionary situation as house
// types, so we translate for display only and keep matching against the
// stored Thai value.
const PERSONNEL_TYPE_EN: Record<string, string> = {
  ผู้จัดการโครงการ: 'Project Manager',
  วิศวกรโครงการ: 'Project Engineer',
  ประสานงานโครงการ: 'Project Coordinator',
  วิศวกรสนาม: 'Site Engineer',
  สถาปนิก: 'Architect',
  โฟร์แมนโครงสร้าง: 'Structure Foreman',
  โฟร์แมนสถาปัตย์: 'Architectural Foreman',
  'จนท.ความปลอดภัย': 'Safety Officer',
  ช่างสำรวจ: 'Surveyor',
  เสมียน: 'Clerk',
  พนักงานคุมสโตร์: 'Store Controller',
  พนักงานควบคุมเครื่องจักร: 'Machine Operator',
  พนักงานขับรถ: 'Driver',
  หัวหน้าชุด: 'Crew Leader',
  ช่างไม้: 'Carpenter',
  'ช่างปูนก่อ, เท Topping': 'Mason, Topping',
  ช่างปูนฉาบ: 'Plasterer',
  ช่างกระเบื้อง: 'Tiler',
  ช่างฝ้าเพดาน: 'Ceiling Installer',
  'ช่างติดตั้ง, สุขภัณฑ์': 'Installer, Sanitary Ware',
  ช่างทาสี: 'Painter',
  'กรรมกร (ชาย/หญิง)': 'Laborer (M/F)',
  ช่างเฟอร์นิเจอร์: 'Furniture Technician',
  ช่างไฟ: 'Electrician',
  'ช่างเหล็ก, ช่างเชื่อม': 'Steel Worker, Welder',
  ช่างแอร์: 'AC Technician',
};

export function translatePersonnelTypeName(name: string | null | undefined, locale: string): string {
  if (!name) return '';
  if (locale !== 'en-US') return name;
  return PERSONNEL_TYPE_EN[name.trim()] ?? name;
}

export function usePersonnelLabel() {
  const { locale } = useI18n({ useScope: 'global' });

  function translatePersonnelType(name: string | null | undefined): string {
    return translatePersonnelTypeName(name, locale.value);
  }

  return { translatePersonnelType };
}
