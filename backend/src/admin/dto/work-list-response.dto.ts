/**
 * Response DTO สำหรับหน้า Admin Work List
 * ป้องกันการใช้ any และกำหนดโครงสร้างข้อมูลให้ชัดเจน
 */

export interface WorkListItem {
  id: number;
  title: string;
  status: string;
  statusBgClass: string;
  statusTextColor: string;
  statusKey: string;
  type: string;
  area: number;
  team: string;
  customer: string;
  date: string | null; // ISO string ของวันที่นัดตรวจ หรือ null ถ้ายอมรับให้ไม่มีวันที่
}

export type WorkListResponse = WorkListItem[];
