import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateHouseTypeDto {
  @ApiProperty({ description: 'ประเภทบ้าน', example: 'บ้านเดี่ยว' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'ประเภทบ้านภาษาอังกฤษ',
    example: 'Detached House',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameEn?: string;
}
