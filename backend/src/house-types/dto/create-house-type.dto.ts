import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateHouseTypeDto {
  @ApiProperty({ description: 'ประเภทบ้าน', example: 'บ้านเดี่ยว' })
  @IsString()
  name: string;
}
