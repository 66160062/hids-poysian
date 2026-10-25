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
import { HouseTypesService } from './house-types.service';
import { CreateHouseTypeDto } from './dto/create-house-type.dto';
import { UpdateHouseTypeDto } from './dto/update-house-type.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('house-types')
export class HouseTypesController {
  constructor(private readonly houseTypesService: HouseTypesService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createHouseTypeDto: CreateHouseTypeDto) {
    return this.houseTypesService.create(createHouseTypeDto);
  }

  @Get()
  findAll() {
    return this.houseTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.houseTypesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateHouseTypeDto: UpdateHouseTypeDto,
  ) {
    return this.houseTypesService.update(+id, updateHouseTypeDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.houseTypesService.remove(+id);
  }
}
