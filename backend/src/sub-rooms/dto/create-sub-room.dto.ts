import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSubRoomDto {
  @ApiProperty({ example: 'ห้องน้ำ' })
  @IsString()
  roomName!: string;

  @ApiProperty({ example: 'Bathroom', required: false })
  @IsOptional()
  @IsString()
  roomNameEn?: string;
}
