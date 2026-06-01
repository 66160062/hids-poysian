import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateContractorDto {
  @ApiProperty({ description: 'ชื่อผู้รับเหมา', example: 'วรวิทย์' })
  @IsString()
  full_name!: string;

  @ApiProperty({ description: 'เบอร์โทรผู้รับเหมา', example: '0987654321' })
  @IsString()
  @MaxLength(10)
  phone_number!: string;

  @ApiProperty({ description: 'อีเมล', example: 'somchai@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'ชื่อบริษัท', example: 'ifbuu จำกัด' })
  @IsString()
  company_name!: string;
}
