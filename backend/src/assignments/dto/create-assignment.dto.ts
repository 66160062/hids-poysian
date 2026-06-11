import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'รหัสงานตรวจ (job)', example: 1 })
  @IsNumber()
  jobId!: number;

  @ApiProperty({ description: 'รหัสผู้ตรวจ (user)', example: 1 })
  @IsNumber()
  inspectorId!: number;
}
