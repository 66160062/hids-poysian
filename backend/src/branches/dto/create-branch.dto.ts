import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const BRANCH_STATUSES = ['active', 'inactive'] as const;

export class CreateBranchDto {
  @ApiProperty({ example: 'บริษัท พอยเซียน จำกัด' })
  @IsString()
  @MaxLength(255)
  branchName!: string;

  @ApiProperty({ required: false, example: '0812345678' })
  @IsOptional()
  @Matches(/^0\d{8,9}$/, {
    message: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลักขึ้นต้นด้วย 0',
  })
  phoneNumber?: string;

  @ApiProperty({ required: false, example: 'contact@poysian.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  mailAddress?: string;

  @ApiProperty({ required: false, example: 'Poysian รับเหมาตรวจบ้าน' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  facebook?: string;

  @ApiProperty({ required: false, example: '@Poysian67' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  line?: string;

  @ApiProperty({ required: false, enum: BRANCH_STATUSES, example: 'active' })
  @IsOptional()
  @IsIn(BRANCH_STATUSES)
  status?: (typeof BRANCH_STATUSES)[number];
}
