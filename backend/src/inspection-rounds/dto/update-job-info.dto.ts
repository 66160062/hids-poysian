import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// ใช้กับ PATCH /inspection-rounds/:id/job-info — endpoint แบบจำกัดสิทธิ์ที่ inspector ที่ถูก
// assign เข้ารอบนี้ (หรือ admin) ใช้แก้ไข "ข้อมูลผู้รับเหมา + รูปหน้าโครงการ + แปลนบ้าน" ของ job
// เท่านั้น — ไม่ใช่ endpoint แก้ไข job แบบเต็มรูปแบบเหมือน PATCH /inspection-jobs/:id ที่ admin ใช้
export class UpdateJobInfoDto {
  @ApiProperty({ description: 'ชื่อผู้รับเหมา', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contractorFullName?: string;

  @ApiProperty({ description: 'เบอร์โทรผู้รับเหมา', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  contractorPhoneNumber?: string;

  @ApiProperty({ description: 'อีเมลผู้รับเหมา', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contractorEmail?: string;

  @ApiProperty({ description: 'ชื่อบริษัทผู้รับเหมา', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contractorCompanyName?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ไฟล์รูปหน้าโครงการ',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  projectImageUrl?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ไฟล์แปลนบ้าน',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  housePlanUrl?: string;
}
