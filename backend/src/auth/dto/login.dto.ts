import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'email', example: 'admin@gmail.com' })
  email!: string;

  @ApiProperty({ description: 'password', example: 'admin1234' })
  password!: string;
}
