import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSummaryTemplateDto {
  @ApiProperty({ example: 'งานโครงสร้าง' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'สภาพโดยรวม' })
  @IsString()
  label!: string;

  @ApiProperty({ example: 'Structural Work', required: false })
  @IsOptional()
  @IsString()
  categoryEn?: string;

  @ApiProperty({ example: 'Overall Condition', required: false })
  @IsOptional()
  @IsString()
  labelEn?: string;
}
