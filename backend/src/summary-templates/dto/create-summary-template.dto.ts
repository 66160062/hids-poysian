import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSummaryTemplateDto {
  @ApiProperty({ example: 'งานโครงสร้าง' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'สภาพโดยรวม' })
  @IsString()
  label!: string;
}
