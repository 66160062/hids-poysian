import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'ห้องนอน' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  roomName: string;
}
