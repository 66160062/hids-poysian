import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ContractorUpdateDefectDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  defectId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  contractorId!: number;

  @ApiProperty({
    required: false,
    example: 'Repaired and sealed the cracked area.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Repair completion image',
    required: false,
  })
  @IsOptional()
  file?: Express.Multer.File;
}
