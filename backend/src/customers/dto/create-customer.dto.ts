import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'ชื่อ-นามสกุลลูกค้า',
    example: 'สมชาย ใจดี',
  })
  @IsString()
  fullName!: string;

  @ApiProperty({
    description: 'เบอร์โทรศัพท์',
    example: '0812345678',
  })
  @IsString()
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: 'เบอร์โทรศัพท์ (เพิ่มเติม 2)',
    example: '0891234567',
  })
  @IsOptional()
  @IsString()
  phoneNumber2?: string;

  @ApiPropertyOptional({
    description: 'เบอร์โทรศัพท์ (เพิ่มเติม 3)',
    example: '0861112222',
  })
  @IsOptional()
  @IsString()
  phoneNumber3?: string;

  @ApiProperty({
    description: 'อีเมล',
    example: 'somchai@email.com',
  })
  @IsString()
  email!: string;

  @ApiPropertyOptional({
    description: 'อีเมล (เพิ่มเติม 2)',
    example: 'somchai2@email.com',
  })
  @IsOptional()
  @IsString()
  email2?: string;

  @ApiPropertyOptional({
    description: 'อีเมล (เพิ่มเติม 3)',
    example: 'somchai3@email.com',
  })
  @IsOptional()
  @IsString()
  email3?: string;

  @ApiProperty({
    description: 'Line ID',
    example: '@somchai',
  })
  @IsString()
  lineId!: string;
}
