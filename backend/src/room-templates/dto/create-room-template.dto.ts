import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateRoomTemplateDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  subRoomId?: number;

  @ApiProperty({ example: '1' })
  @IsNumber()
  floorId: number;
}
