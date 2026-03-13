import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateInspectorDto {
  @ApiProperty({
    description: 'ชื่อ-นามสกุล',
    example: 'Triphop Tropphai',
  })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'ไอดีทีม',
    example: '101',
  })
  @IsNotEmpty()
  @IsNumber()
  teamId: number;

  @ApiProperty({
    description: 'เบอร์โทร',
    example: '0987654321',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'อีเมล',
    example: 'triphop@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'ไลน์ไอดี',
    example: 'Triphop007X',
  })
  lineId: string;

  @ApiProperty({
    description: 'รหัสผ่าน',
    example: '123456789',
  })
  password: string;

  @ApiProperty({
    description: 'ตำแหน่ง',
    example: 'inspector',
  })
  role: string;
}
