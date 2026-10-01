import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubRoomsService } from './sub-rooms.service';
import { CreateSubRoomDto } from './dto/create-sub-room.dto';
import { UpdateSubRoomDto } from './dto/update-sub-room.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('sub-rooms')
export class SubRoomsController {
  constructor(private readonly subRoomsService: SubRoomsService) {}

  @Post()
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateSubRoomDto: UpdateSubRoomDto) {
    return this.subRoomsService.update(+id, updateSubRoomDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.subRoomsService.remove(+id);
  }
}
