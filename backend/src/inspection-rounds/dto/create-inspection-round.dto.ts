import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateInspectionRoundDto {
  @ApiProperty({ description: 'รหัสงานตรวจ', example: 1 })
  @IsNumber()
  jobId: number;

  @ApiProperty({ description: 'รหัสสมาชิกทีม', example: 1 })
  @IsNumber()
  teamMemberId: number;

  @ApiProperty({ description: 'รอบที่', example: 1 })
  @IsNumber()
  roundNumber: number;

  @ApiProperty({ description: 'วันที่นัดตรวจ', example: '2026-03-12' })
  @IsDateString()
  scheduledDate: Date;

  @ApiProperty({ description: 'สถานะ', example: 'SCHEDULED', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
