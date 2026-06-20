import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ชื่อ-นามสกุล',
    example: 'Triphop Tropphai',
  })
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description: 'ไอดีทีม',
    example: '101',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  teamId?: number;

  @ApiProperty({
    description: 'เบอร์โทร',
    example: '0987654321',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'อีเมล',
    example: 'triphop@gmail.com',
  })
  email!: string;

  @ApiProperty({
    description: 'ไลน์ไอดี',
    example: 'Triphop007X',
  })
  @IsString()
  @IsOptional()
  lineId?: string;

  @ApiProperty({
    description: 'รหัสผ่าน',
    example: '123456789',
  })
  password!: string;

  @ApiProperty({
    description: 'ตำแหน่ง',
    example: 'inspector',
  })
  role!: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ลิงก์รูปภาพผู้ใช้',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
