import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('rooms')
export class RoomsController {

  constructor(private readonly roomsService: RoomsService) { }

  // CREATE
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {

    return this.roomsService.create(createRoomDto);

  }

  // READ ALL
  @Get()
  findAll() {

    return this.roomsService.findAll();

  }

  // READ ONE
  @Get(':id')
  findOne(@Param('id') id: string) {

    return this.roomsService.findOne(+id);

  }

  // UPDATE
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {

    return this.roomsService.update(+id, updateRoomDto);

  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.roomsService.remove(+id);

  }

}