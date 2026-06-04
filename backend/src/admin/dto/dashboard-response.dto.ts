/**
 * Response DTO สำหรับ Admin Dashboard API
 * กำหนด Interface สำหรับ Type Safety ทั้ง Backend และ Frontend
 */

/** โครงสร้างของ Task Item ที่ส่งไปให้ Frontend แสดงผล */
export interface DashboardTaskItem {
  id: number;
  title: string;
  meta: string;
  status: string;
  statusBgClass: string;
  statusTextColor: string;
  icon: string;
  avatarBgClass: string;
  avatarTextColor: string;
  day: number;
  team: string;
  customer: string;
}

/** โครงสร้าง Response ของ GET /admin/dashboard */
export interface DashboardResponse {
  totalProjects: number;
  inProgress: number;
  singleHouse: number;
  townhouse: number;
  condo: number;
  construction: number;
  tasks: DashboardTaskItem[];
}
