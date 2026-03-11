import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HouseTypesService } from './house-types.service';
import { CreateHouseTypeDto } from './dto/create-house-type.dto';
import { UpdateHouseTypeDto } from './dto/update-house-type.dto';

@Controller('house-types')
export class HouseTypesController {
  constructor(private readonly houseTypesService: HouseTypesService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() updateHouseTypeDto: UpdateHouseTypeDto,
  ) {
    return this.houseTypesService.update(+id, updateHouseTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.houseTypesService.remove(+id);
  }
}
