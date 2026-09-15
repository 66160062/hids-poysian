import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ description: 'ชื่อทีม', example: 'WENAT Team A' })
  @IsString()
  team_name!: string;

  @ApiProperty({ description: 'ไอดีสาขา', example: '1', required: false })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  branchId?: number;

  @ApiProperty({
    description: 'ลิงก์โลโก้',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  logo_url?: string | null;

  @ApiProperty({
    description: 'ข้อมูลติดต่อ',
    example: '081-884-7879',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_info?: string;

  @ApiProperty({ description: 'สถานะ', example: 'active', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
