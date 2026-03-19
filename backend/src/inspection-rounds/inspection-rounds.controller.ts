import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';

@Controller('inspection-rounds')
export class InspectionRoundsController {
  constructor(private readonly inspectionRoundsService: InspectionRoundsService) {}

  @Post()
  create(@Body() createInspectionRoundDto: CreateInspectionRoundDto) {
    return this.inspectionRoundsService.create(createInspectionRoundDto);
  }

  @Get()
  findAll() {
    return this.inspectionRoundsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionRoundsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInspectionRoundDto: UpdateInspectionRoundDto) {
    return this.inspectionRoundsService.update(+id, updateInspectionRoundDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionRoundsService.remove(+id);
  }
}
