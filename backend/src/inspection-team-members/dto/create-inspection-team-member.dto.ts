import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateInspectionTeamMemberDto {
  @ApiProperty({ description: 'รหัสงานตรวจ (job)', example: 1 })
  @IsNumber()
  jobId!: number;

  @ApiProperty({ description: 'รหัสผู้ตรวจ (user)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  inspectorId?: number;

  @ApiProperty({ description: 'รหัสทีมตรวจ (team)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  teamId?: number;
}
