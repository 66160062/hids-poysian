/**
 * Response DTO สำหรับ Admin Dashboard API
 * กำหนด Interface สำหรับ Type Safety ทั้ง Backend และ Frontend
 */

/**
 * รหัสสถานะงานที่ Frontend ใช้แปลเป็นข้อความตามภาษาที่ผู้ใช้เลือก
 * (`status` เป็นข้อความไทยตายตัว เก็บไว้เพื่อความเข้ากันได้กับของเดิมเท่านั้น)
 */
export type DashboardStatusCode =
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DRAFT';

/** โครงสร้างของ Task Item ที่ส่งไปให้ Frontend แสดงผล */
export interface DashboardTaskItem {
  id: number;
  jobId: number;
  inspectionType: string;
  title: string;
  meta: string;
  /** วันที่อ้างอิงแบบ ISO ให้ Frontend จัดรูปแบบตามภาษาเอง — null ถ้าวันที่ไม่ถูกต้อง */
  referenceDate: string | null;
  status: string;
  statusCode: DashboardStatusCode;
  /** เลขรอบล่าสุด ใช้ต่อท้ายสถานะ "เสร็จสิ้น" */
  roundNumber: number | null;
  statusBgClass: string;
  statusTextColor: string;
  icon: string;
  avatarBgClass: string;
  avatarTextColor: string;
  day: number;
  team: string;
  customer: string;
  branchId?: number | null;
  branchName?: string | null;
}

export interface DashboardBranchOption {
  id: number;
  name: string;
}

/** จำนวนงานแยกตามสถานะ ใช้แสดงใต้ตัวเลขรวมในการ์ดสรุป */
export interface DashboardStatusCount {
  status: string;
  statusCode: DashboardStatusCode;
  count: number;
}

export interface MonthlyTrendItem {
  monthKey: string;
  monthLabel: string;
  homeInspection: number;
  construction: number;
  total: number;
}

export interface JobDefectCategoryItem {
  categoryId: number;
  categoryName: string;
  categoryNameEn?: string | null;
  count: number;
  percentage: number;
  color?: string;
}

export interface JobDefectResolution {
  pending: number;
  repaired: number;
  verified: number;
  total: number;
  completionRate: number;
}

export interface JobDrilldownItem {
  jobId: number;
  title: string;
  customerName: string;
  inspectionType: string;
  status: string;
  statusCode: DashboardStatusCode;
  contractorName?: string | null;
  defectCategories: JobDefectCategoryItem[];
  resolution: JobDefectResolution;
}

export interface TeamWorkloadItem {
  teamId: number;
  teamName: string;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

export interface PropertyTypeItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

/** โครงสร้าง Response ของ GET /admin/dashboard */
export interface DashboardResponse {
  totalProjects: number;
  inProgress: number;
  singleHouse: number;
  townhouse: number;
  condo: number;
  construction: number;
  totalDefects: number;
  overallCompletionRate: number;
  homeStatusBreakdown: DashboardStatusCount[];
  constructionStatusBreakdown: DashboardStatusCount[];
  branches: DashboardBranchOption[];
  calendarEvents: number[];
  tasks: DashboardTaskItem[];
  monthlyTrends: MonthlyTrendItem[];
  jobDrilldowns: JobDrilldownItem[];
  teamWorkloads: TeamWorkloadItem[];
  propertyTypes: PropertyTypeItem[];
  topDefectCategories?: JobDefectCategoryItem[];
  overallDefectResolution?: JobDefectResolution;
}
