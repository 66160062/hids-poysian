import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

// multipart/form-data ส่งค่ามาเป็น string เสมอ ต้องใช้ @Type(() => Number) แปลงก่อน validate
export class CreateInspectionSummaryItemPhotoDto {
  @Type(() => Number)
  @IsInt()
  roundId!: number;

  @Type(() => Number)
  @IsInt()
  templateId!: number;

  @Type(() => Number)
  @IsInt()
  optionId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  refItemId?: number;
}
