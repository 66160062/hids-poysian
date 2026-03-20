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
  job: {
    projectName: string;
    projectImageUrl: string;
    inspectionType: string;
    houseType: { name: string };
    customer: { fullName: string; phoneNumber: string };
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
