import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoomTemplateDto {
  @ApiProperty({ example: 'ห้องนอน' })
  @IsString()
  roomName: string;

  @ApiProperty({ example: '1' })
  @IsString()
  floor: string;

  @ApiProperty({ example: '-' })
  @IsString()
  roomType: string;
}
