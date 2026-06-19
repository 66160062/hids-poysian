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
}

export interface InspectionRound {
  roundId: number;
  scheduledDate: string;
  status: string;
  roundNumber: string;
  inspectedAt?: string | null;
  summaryCompletedAt?: string | null;
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
    category?: { name: string; categoryId: number };
  }[];
  room?: { roomName: string; roomId: number };
  subRoom?: { roomName: string; subRoomId: number } | null;
  floor?: { floorId: number; label: string };
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
  refItemId?: number | null;
  refItem?: Pick<InspectionSummaryItem, 'itemId'> | null;
  detailValue?: string;
}

export interface DefectCategory {
  categoryId: number;
  name: string;
}

export interface DefectSubCategory {
  subCategoryId: number;
  name: string;
  category?: DefectCategory;
}

export interface SubRoom {
  subRoomId: number;
  roomName: string;
}

export interface Floor {
  floorId: number;
  label: string;
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
}
