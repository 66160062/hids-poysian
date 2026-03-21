import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoomTemplateDto {
  @ApiProperty({ example: 'ห้องนอน' })
  @IsString()
  roomName: string;

  @ApiProperty({ example: '1' })
  @IsString()
  floorId: number;

  @ApiProperty({ example: '1' })
  @IsString()
  subRoomId: number;

  @ApiProperty({ example: '-' })
  @IsString()
  roomType: string;
}
