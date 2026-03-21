import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSubRoomDto {
  @ApiProperty({ example: 'ห้องน้ำ' })
  @IsString()
  room_name: string;
}
