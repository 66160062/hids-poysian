export interface Room {
  roomId: number;
  roomName: string;
  roomNameEn?: string | null;
}

export interface CreateRoomDto {
  roomName: string;
  roomNameEn?: string | null;
}

export interface UpdateRoomDto {
  roomName?: string;
  roomNameEn?: string | null;
}

export interface SubRoom {
  subRoomId: number;
  roomName: string;
  roomNameEn?: string | null;
}

export interface CreateSubRoomDto {
  roomName: string;
  roomNameEn?: string | null;
}

export interface UpdateSubRoomDto {
  roomName?: string;
  roomNameEn?: string | null;
}

export interface DefectCategory {
  categoryId: number;
  name: string;
  nameEn?: string | null;
  subCategories?: DefectSubCategory[];
}

export interface CreateDefectCategoryDto {
  name: string;
  nameEn?: string | null;
}

export interface UpdateDefectCategoryDto {
  name?: string;
  nameEn?: string | null;
}

export interface DefectSubCategory {
  subCategoryId: number;
  name: string;
  nameEn?: string | null;
  category?: DefectCategory;
}

export interface CreateDefectSubCategoryDto {
  name: string;
  nameEn?: string | null;
  categoryId: number;
}

export interface UpdateDefectSubCategoryDto {
  name?: string;
  nameEn?: string | null;
  categoryId?: number;
}

export interface Floor {
  floorId: number;
  label: string;
  labelEn?: string | null;
  floorOrder?: number;
}

export interface CreateFloorDto {
  label: string;
  labelEn?: string | null;
  floorOrder?: number;
}

export interface UpdateFloorDto {
  label?: string;
  labelEn?: string | null;
  floorOrder?: number;
}

