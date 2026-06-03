import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({ example: 'ชั้น 1' })
  @IsString()
  label!: string;
}
