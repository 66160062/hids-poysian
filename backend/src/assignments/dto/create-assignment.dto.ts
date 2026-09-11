import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'รหัสงานตรวจ (job)', example: 1 })
  @IsNumber()
  jobId!: number;

  @ApiProperty({ description: 'รหัสผู้ตรวจ (user)', example: 1 })
  @IsNumber()
  inspectorId!: number;

  @ApiPropertyOptional({
    description:
      'รหัสรอบตรวจ — ถ้าระบุ จะมอบหมายเฉพาะรอบนี้เท่านั้น ถ้าไม่ระบุ จะมอบหมายทั้ง job (เข้าถึงได้ทุกรอบ)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  roundId?: number;
}
