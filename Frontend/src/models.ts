export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}
export enum UserRole {
  ADMIN = 'admin',
  INSPECTOR = 'inspector',
}
export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  lineId: string;
  password?: string | undefined;
  role: UserRole | string;
  imageUrl?: string | undefined;
  team?: Team | undefined;
  teamId?: number | undefined;
  branchId?: number | null | undefined;
  branch?: { branchId: number; branchName: string; logoUrl?: string | null } | undefined;
}

export interface InspectionRound {
  roundId: number;
  scheduledDate: string;
  status: string;
  roundNumber: string;
  inspectedAt?: string | null;
  summaryCompletedAt?: string | null;
  completionPercent?: number | null;
  completionDefectScore?: number | null;
  completionSystemScore?: number | null;
  aiSummaryText?: string | null;
  aiSummaryProvider?: string | null;
  lastPdfGeneratedAt?: string | null;
  teamMember?: { inspector?: { team?: { teamName: string; contactInfo: string } } };
  job: {
    jobId: number;
    projectName: string;
    projectNameEn?: string | null;
    projectImageUrl: string;
    inspectionType: string;
    branch?: { branchId: number; branchName: string; phoneNumber: string; mailAddress: string;  facebook: string; line: string; logoUrl: string | null } | null;
    houseType: { name: string; nameEn?: string | null };
    customer: { fullName: string; phoneNumber: string; phoneNumber2: string; phoneNumber3: string; email: string; email2: string; email3: string; };
    contractor?: {
      contractorId: number;
      fullName: string;
      phoneNumber: string;
      email?: string;
      companyName?: string;
    } | null;
    createdBy?: { fullName: string; phoneNumber: string; email?: string } | null;
    usableArea: string;
    address: {
      houseNumber: string;
      subDistrict: string;
      district: string;
      province: string;
      soi: string;
      floor: string;
      postalCode: string;
    };
  };
}

export interface WeekDay {
  label: string;
  date: number;
  dateStr: string;
  isActive: boolean;
  hasDot: boolean;
}

export interface Category {
  categoryId: number;
  name: string;
  nameEn?: string | null;
}

export interface SubCategory {
  subCategoryId: number;
  name: string;
  nameEn?: string | null;
  categoryId: Category;
}
export interface HousePlan {
  planId: number;
  name: string;
  nameEn?: string | null;
  imageUrl: string;
  orderIndex: number;
  floor?: { floorId: number; label: string; labelEn?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Defect {
  defectId: number;
  description: string;
  severity: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  contractorImageUrl?: string;
  contractorNote?: string;
  subCategories: {
    subCategoryId: number;
    name: string;
    nameEn?: string | null;
    category?: { name: string; nameEn?: string | null; categoryId: number };
  }[];
  room?: { roomName: string; roomNameEn?: string | null; roomId: number };
  subRoom?: { roomName: string; roomNameEn?: string | null; subRoomId: number } | null;
  floor?: { floorId: number; label: string; labelEn?: string | null; floorOrder?: number };
  plan?: HousePlan | null;
  planId?: number | null;
  planX?: number | null;
  planY?: number | null;
  locationZone?: string | null;
}

export interface SummaryTemplateOption {
  optionId: number;
  value: string;
  valueEn?: string | null;
  group: string;
  groupEn?: string | null;
  type: string;
}

export interface SummaryTemplate {
  templateId: number;
  category: string;
  categoryEn?: string | null;
  label: string;
  labelEn?: string | null;
  options: SummaryTemplateOption[];
}

export interface InspectionSummaryItem {
  itemId: number;
  template: SummaryTemplate;
  option: SummaryTemplateOption | null; // null = แถวรูปหลักฐาน (ดู photoUrl)
  refItemId?: number | null;
  refItem?: Pick<InspectionSummaryItem, 'itemId'> | null;
  detailValue?: string;
  photoUrl?: string | null;
}

export interface DefectCategory {
  categoryId: number;
  name: string;
  nameEn?: string | null;
}

export interface DefectSubCategory {
  subCategoryId: number;
  name: string;
  nameEn?: string | null;
  category?: DefectCategory;
}

export interface SubRoom {
  subRoomId: number;
  roomName: string;
  roomNameEn?: string | null;
}

export interface Floor {
  floorId: number;
  label: string;
  labelEn?: string | null;
  floorOrder?: number;
}

export interface RoomTemplate {
  templateId: number;
  roomName: string;
  roomType: string;
  floor: Floor;
  subRoom: SubRoom;
}

export interface Team {
  team_Id: number;
  team_name: string;
  contact_info?: string;
  logo_url?: string;
  branchId?: number | null;
  branch?: { branchId: number; branchName: string | null } | null;
}
