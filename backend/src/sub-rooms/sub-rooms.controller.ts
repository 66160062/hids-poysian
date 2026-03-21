import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubRoomsService } from './sub-rooms.service';
import { CreateSubRoomDto } from './dto/create-sub-room.dto';
import { UpdateSubRoomDto } from './dto/update-sub-room.dto';

@Controller('sub-rooms')
export class SubRoomsController {
  constructor(private readonly subRoomsService: SubRoomsService) {}

  @Post()
  create(@Body() createSubRoomDto: CreateSubRoomDto) {
    return this.subRoomsService.create(createSubRoomDto);
  }

  @Get()
  findAll() {
    return this.subRoomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subRoomsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubRoomDto: UpdateSubRoomDto) {
    return this.subRoomsService.update(+id, updateSubRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subRoomsService.remove(+id);
  }
}
