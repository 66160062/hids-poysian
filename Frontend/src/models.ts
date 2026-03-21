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
  role: UserRole | string;
  createdAt: string;
  deletedAt: string | null;
}

export interface InspectionRound {
  roundId: number;
  scheduledDate: string;
  status: string;
  roundNumber: string;
  teamMember?: { inspector?: { team?: { teamName: string; contactInfo: string } } };
  job: {
    projectName: string;
    projectImageUrl: string;
    inspectionType: string;
    houseType: { name: string };
    customer: { fullName: string; phoneNumber: string; email: string };
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
}

export interface SubCategory {
  subCategoryId: number;
  name: string;
  categoryId: Category;
}
export interface Defect {
  defectId: number;
  description: string;
  severity: string;
  status: string;
  imageUrl?: string;
  subCategories: {
    subCategoryId: number;
    name: string;
    category?: { name: string };
  }[];
  template?: {
    roomName: string;
    roomType: string;
    floor: string;
  };
}

export interface SummaryTemplateOption {
  optionId: number;
  value: string;
  group: string;
  type: string;
}

export interface SummaryTemplate {
  templateId: number;
  category: string;
  label: string;
  options: SummaryTemplateOption[];
}

export interface InspectionSummaryItem {
  itemId: number;
  template: SummaryTemplate;
  option: SummaryTemplateOption;
  detailValue?: string;
}
