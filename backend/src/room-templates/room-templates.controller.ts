import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomTemplatesService } from './room-templates.service';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';

@Controller('room-templates')
export class RoomTemplatesController {
  constructor(private readonly roomTemplatesService: RoomTemplatesService) {}

  @Post()
  create(@Body() createRoomTemplateDto: CreateRoomTemplateDto) {
    return this.roomTemplatesService.create(createRoomTemplateDto);
  }

  @Get()
  findAll() {
    return this.roomTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomTemplatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomTemplateDto: UpdateRoomTemplateDto) {
    return this.roomTemplatesService.update(+id, updateRoomTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomTemplatesService.remove(+id);
  }
}
