import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContractorDto {
  @ApiProperty({ description: 'ชื่อผู้รับเหมา', example: 'วรวิทย์' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'เบอร์โทรผู้รับเหมา', example: '0987654321' })
  @IsString()
  @MaxLength(15)
  phoneNumber: string;

  @ApiProperty({ description: 'อีเมล (ไม่บังคับ)', example: 'somchai@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'ชื่อบริษัท (ไม่บังคับ)', example: 'ifbuu จำกัด', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;
}
