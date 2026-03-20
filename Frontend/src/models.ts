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
