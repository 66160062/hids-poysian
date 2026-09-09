import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RoundSummaryItemDto {
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

export class ReplaceRoundSummaryItemsDto {
  @ApiProperty({ type: [RoundSummaryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundSummaryItemDto)
  items!: RoundSummaryItemDto[];
}
