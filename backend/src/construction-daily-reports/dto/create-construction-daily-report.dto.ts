import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PersonnelType } from '../entities/daily-personnel.entity';

export class WorkItemDto {
  @ApiProperty({ description: 'ลำดับ', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sequence?: number;

  @ApiProperty({
    description: 'พิกัด / ห้อง',
    example: 'ห้องรับแขก',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ description: 'รายละเอียดงานที่ปฏิบัติ', example: 'เทปูนพื้น' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'หน่วย', example: 'ตร.ม.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  unit?: string;

  @ApiProperty({ description: 'แผน (%)', example: 100, required: false })
  @IsNumber()
  @IsOptional()
  plannedPercent?: number;

  @ApiProperty({ description: 'ทำได้จริง (%)', example: 80 })
  @IsNumber()
  @IsOptional()
  actualPercent?: number;

  @ApiProperty({ description: 'คงเหลือ (%)', example: 20, required: false })
  @IsNumber()
  @IsOptional()
  remainingPercent?: number;

  @ApiProperty({ description: 'หมายเหตุ', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

export class PersonnelDto {
  @ApiProperty({ description: 'ชื่อ/ตำแหน่ง', example: 'ช่างไม้' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'ประเภท',
    enum: PersonnelType,
    example: PersonnelType.WORKER,
  })
  @IsEnum(PersonnelType)
  type!: PersonnelType;

  @ApiProperty({ description: 'จำนวนคน', example: 5 })
  @IsNumber()
  count!: number;

  @ApiProperty({ description: 'จำนวนชั่วโมง', example: 8, required: false })
  @IsNumber()
  @IsOptional()
  hours?: number;
}

export class IssueDto {
  @ApiProperty({ description: 'รายละเอียดปัญหา', example: 'ปูนขาด' })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'สถานะ / หมายเหตุ',
    example: 'รอดำเนินการ',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  note?: string;
}

export class AccidentReportDto {
  @ApiProperty({ description: 'จำนวนครั้งของอุบัติเหตุ', example: 1 })
  @IsNumber()
  @IsOptional()
  accidentCount?: number;

  @ApiProperty({
    description: 'รายละเอียดอุบัติเหตุ',
    example: 'คนงานตกจากนั่งร้าน',
  })
  @IsString()
  description!: string;
}

export class DailyMachineDto {
  @ApiProperty({
    description: 'ชื่อหรือประเภทเครื่องจักร',
    example: 'รถแบ็คโฮ',
  })
  @IsString()
  @MaxLength(100)
  machineName!: string;

  @ApiProperty({
    description: 'ขนาดเครื่องจักร',
    example: 'PC200',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  machineSize?: string;

  @ApiProperty({ description: 'จำนวนเครื่อง', example: 2 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ description: 'ชั่วโมงทำงาน', example: 8, required: false })
  @IsNumber()
  @IsOptional()
  workingHours?: number;
}

export class CreateConstructionDailyReportDto {
  @ApiProperty({ description: 'Round ID (รอบการตรวจ)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  roundId!: number;

  @ApiProperty({ description: 'วันที่รายงาน', example: '2026-06-19' })
  @IsString()
  @MaxLength(50)
  reportDate!: string;

  @ApiProperty({ description: 'สภาพอากาศ', example: 'Sunny', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  weather?: string;

  @ApiProperty({
    description: 'ช่วงเวลาทำงาน',
    example: '08:00 - 17:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workingPeriod?: string;

  @ApiProperty({ description: 'ชื่อผู้รับเหมา', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  contractorName?: string;

  @ApiProperty({ description: 'ชื่อผู้รายงาน', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reporterName?: string;

  @ApiProperty({ description: 'ตำแหน่ง', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @ApiProperty({
    description: 'รายละเอียดงาน',
    type: [WorkItemDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkItemDto)
  @IsOptional()
  workItems?: WorkItemDto[];

  @ApiProperty({
    description: 'บุคลากร/คนงาน',
    type: [PersonnelDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonnelDto)
  @IsOptional()
  personnels?: PersonnelDto[];

  @ApiProperty({
    description: 'ปัญหา/หมายเหตุ',
    type: [IssueDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueDto)
  @IsOptional()
  issues?: IssueDto[];

  @ApiProperty({
    description: 'รายงานอุบัติเหตุ',
    type: [AccidentReportDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccidentReportDto)
  @IsOptional()
  accidents?: AccidentReportDto[];

  @ApiProperty({
    description: 'เครื่องจักร/อุปกรณ์',
    type: [DailyMachineDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyMachineDto)
  @IsOptional()
  machines?: DailyMachineDto[];
}
