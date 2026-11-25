import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'email', example: 'admin@gmail.com' })
  @Allow()
  email!: string;

  @ApiProperty({ description: 'password', example: 'admin1234' })
  @Allow()
  password!: string;
}
