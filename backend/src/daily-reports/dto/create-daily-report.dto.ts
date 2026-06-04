import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDailyReportDto {
  @ApiProperty({ description: 'Customer ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: 'Address ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  addressId: number;

  @ApiProperty({ description: 'House type ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  houseTypeId: number;

  @ApiProperty({ description: 'Inspector user ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  inspectorId: number;

  @ApiProperty({ description: 'Inspection type', example: 'ตรวจ Defect' })
  @IsString()
  @MaxLength(50)
  inspectionType: string;

  @ApiProperty({ description: 'Project name', example: 'หมู่บ้านแสนสุข วิลเลจ' })
  @IsString()
  @MaxLength(255)
  projectName: string;

  @ApiProperty({
    description: 'Location coordinate',
    example: '13.7563,100.5018',
  })
  @IsString()
  @MaxLength(255)
  locationCoordinate: string;

  @ApiProperty({
    description: 'House plan URL',
    example: 'https://example.com/plan.pdf',
  })
  @IsString()
  @MaxLength(255)
  housePlanUrl: string;

  @ApiProperty({ description: 'Usable area in square meters', example: 150.5 })
  @Type(() => Number)
  @IsNumber()
  usableArea: number;

  @ApiProperty({
    description: 'Project image URL',
    example: '/uploads/inspection_jobs/unknown.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectImageUrl?: string;

  @ApiProperty({
    description: 'Inspection job status',
    enum: ['Draft', 'Active', 'Completed', 'Cancelled'],
    default: 'Active',
    required: false,
  })
  @IsString()
  @MaxLength(50)
  @IsEnum(['Draft', 'Active', 'Completed', 'Cancelled'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'First round scheduled date',
    example: '2026-03-12',
  })
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @ApiProperty({
    description: 'First round status',
    example: 'SCHEDULED',
    required: false,
  })
  @IsString()
  @IsOptional()
  roundStatus?: string;
}
