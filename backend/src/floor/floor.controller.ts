import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FloorService } from './floor.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('floor')
export class FloorController {
  constructor(private readonly floorService: FloorService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createFloorDto: CreateFloorDto) {
    return this.floorService.create(createFloorDto);
  }

  @Get()
  findAll() {
    return this.floorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.floorService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateFloorDto: UpdateFloorDto) {
    return this.floorService.update(+id, updateFloorDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.floorService.remove(+id);
  }
}
