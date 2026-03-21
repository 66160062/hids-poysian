import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoomTemplateDto {
  @ApiProperty({ example: 'ห้องนอน' })
  @IsString()
  roomName: string;

  @ApiProperty({ example: '1' })
  @IsNumber()
  floorId: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  subRoomId?: number;

  @ApiProperty({ example: '-' })
  @IsString()
  roomType: string;
}
