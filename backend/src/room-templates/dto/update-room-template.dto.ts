import { PartialType } from '@nestjs/swagger';
import { CreateRoomTemplateDto } from './create-room-template.dto';

export class UpdateRoomTemplateDto extends PartialType(CreateRoomTemplateDto) {}
