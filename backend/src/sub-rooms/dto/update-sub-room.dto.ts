import { PartialType } from '@nestjs/swagger';
import { CreateSubRoomDto } from './create-sub-room.dto';

export class UpdateSubRoomDto extends PartialType(CreateSubRoomDto) {}
