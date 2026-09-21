import type { JobStatusCode } from 'src/composables/useJobStatus';

export interface StatusCount {
  status: string;
  statusCode: JobStatusCode;
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
  statusCode: JobStatusCode;
  contractorName?: string | null;
  defectCategories: JobDefectCategoryItem[];
  resolution: JobDefectResolution;
}

export interface BranchOption {
  id: number;
  name: string;
}

export interface DashboardTaskItem {
  id: number;
  jobId: number;
  inspectionType: string;
  title: string;
  meta: string;
  referenceDate: string | null;
  status: string;
  statusCode: JobStatusCode;
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

export interface DashboardStats {
  totalProjects: number;
  inProgress: number;
  singleHouse: number;
  townhouse: number;
  condo: number;
  construction: number;
  totalDefects?: number;
  overallCompletionRate?: number;
  homeStatusBreakdown: StatusCount[];
  constructionStatusBreakdown: StatusCount[];
  branches?: BranchOption[];
  calendarEvents?: number[];
  tasks?: DashboardTaskItem[];
  monthlyTrends?: MonthlyTrendItem[];
  jobDrilldowns?: JobDrilldownItem[];
  teamWorkloads?: TeamWorkloadItem[];
  propertyTypes?: PropertyTypeItem[];
  topDefectCategories?: JobDefectCategoryItem[];
  overallDefectResolution?: JobDefectResolution;
}
