import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'ห้องนอน' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  roomName!: string;

  @ApiProperty({ example: 'Bedroom', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  roomNameEn?: string;
}
