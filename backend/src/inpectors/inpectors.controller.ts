import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InpectorsService } from './inpectors.service';
import { CreateInpectorDto } from './dto/create-inpector.dto';
import { UpdateInpectorDto } from './dto/update-inpector.dto';

@Controller('inpectors')
export class InpectorsController {
  constructor(private readonly inpectorsService: InpectorsService) {}

  @Post()
  create(@Body() createInpectorDto: CreateInpectorDto) {
    return this.inpectorsService.create(createInpectorDto);
  }

  @Get()
  findAll() {
    return this.inpectorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inpectorsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInpectorDto: UpdateInpectorDto,
  ) {
    return this.inpectorsService.update(+id, updateInpectorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inpectorsService.remove(+id);
  }
}
