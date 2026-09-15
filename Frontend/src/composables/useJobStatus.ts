import { useI18n } from 'vue-i18n';

// รหัสสถานะกลางสำหรับแสดงผล — แยกค่า (ใช้เทียบ/เลือกสี) ออกจากข้อความ (แปลตามภาษา)
// ต้องตรงกับ DashboardStatusCode ฝั่ง backend (admin/dto/dashboard-response.dto.ts) บวก LOCKED
export type JobStatusCode =
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DRAFT'
  | 'LOCKED';

// InspectionRound.status ดิบจาก backend → รหัสแสดงผล
export function roundStatusCode(status: string): JobStatusCode {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'COMPLETED';
    case 'SUBMITTED':
      return 'PENDING_APPROVAL';
    case 'SCHEDULED':
    default:
      return 'IN_PROGRESS';
  }
}

// InspectionJob.status ดิบ (InspectionJobStatus enum ฝั่ง backend) → รหัสแสดงผล
const JOB_STATUS_CODES: Record<string, JobStatusCode> = {
  Active: 'IN_PROGRESS',
  Pending: 'PENDING_APPROVAL',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  Draft: 'DRAFT',
  Locked: 'LOCKED',
};

export function jobStatusCode(status: string | null | undefined): JobStatusCode | null {
  return status ? (JOB_STATUS_CODES[status] ?? null) : null;
}

export function useJobStatus() {
  const i18n = useI18n({ useScope: 'global' });

  function jobStatusLabel(code: string | null | undefined, roundNumber?: number | null): string {
    if (!code) return '-';
    if (code === 'COMPLETED' && roundNumber) {
      return i18n.t('common.jobStatus.COMPLETED_ROUND', { round: roundNumber });
    }
    const key = `common.jobStatus.${code}`;
    // รหัสที่ไม่รู้จัก (เช่นข้อมูลเก่า) แสดงค่าดิบแทนการโชว์ชื่อคีย์
    return i18n.te(key) ? i18n.t(key) : code;
  }

  return { jobStatusLabel };
}
