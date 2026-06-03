import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInspectionSummaryItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  roundId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  templateId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  optionId!: number;

  @ApiProperty({ example: 'หมายเหตุเพิ่มเติม', required: false })
  @IsOptional()
  @IsString()
  detailValue?: string;
}
