import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator/types/decorator/string/MaxLength';
import { IsString } from 'class-validator/types/decorator/typechecker/IsString';

export class CreateDefectsCategoryDto {
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'โครงสร้าง' })
  @IsString()
  @MaxLength(255)
  name: string;
}
