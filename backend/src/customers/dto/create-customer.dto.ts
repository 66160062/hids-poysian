import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'ชื่อ-นามสกุลลูกค้า',
    example: 'สมชาย ใจดี',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'เบอร์โทรศัพท์',
    example: '0812345678',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'อีเมล',
    example: 'somchai@email.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Line ID',
    example: '@somchai',
  })
  @IsString()
  lineId: string;
}
