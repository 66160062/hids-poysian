import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({ example: 'ชั้น 1' })
  @IsString()
  label!: string;

  @ApiProperty({
    example: 3,
    required: false,
    description: 'ลำดับชั้นสำหรับเรียงรายงาน (น้อย = อยู่บนสุด เช่น หลังคา=0)',
  })
  @IsOptional()
  @IsInt()
  floorOrder?: number;
}
