import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSummaryTemplateOptionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  templateId: number;

  @ApiProperty({ example: 'ผนังก่ออิฐฉาบปูน' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'รูปแบบโครงสร้าง', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({ example: 'checkbox', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
