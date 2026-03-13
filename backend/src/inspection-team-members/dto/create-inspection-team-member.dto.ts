import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateInspectionTeamMemberDto {
  @ApiProperty({ description: 'รหัสงานตรวจ', example: 1 })
  @IsNumber()
  jobId: number;

  @ApiProperty({ description: 'รหัสเจ้าหน้าที่ผู้ตรวจ', example: 1 })
  @IsNumber()
  inspectorId: number;
}
