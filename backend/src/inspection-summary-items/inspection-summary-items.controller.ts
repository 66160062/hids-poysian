import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';

@Controller('inspection-summary-items')
export class InspectionSummaryItemsController {
  constructor(
    private readonly inspectionSummaryItemsService: InspectionSummaryItemsService,
  ) {}

  @Post()
  create(
    @Body() createInspectionSummaryItemDto: CreateInspectionSummaryItemDto,
  ) {
    return this.inspectionSummaryItemsService.create(
      createInspectionSummaryItemDto,
    );
  }

  @Get()
  findAll() {
    return this.inspectionSummaryItemsService.findAll();
  }

  @Get('round/:roundId')
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.findByRound(roundId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionSummaryItemDto: UpdateInspectionSummaryItemDto,
  ) {
    return this.inspectionSummaryItemsService.update(
      +id,
      updateInspectionSummaryItemDto,
    );
  }

  @Delete('round/:roundId')
  deleteByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.deleteByRound(roundId);
  }

  @Delete('round/:roundId/template/:templateId')
  deleteByRoundAndTemplate(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.inspectionSummaryItemsService.deleteByRoundAndTemplate(
      roundId,
      templateId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.remove(+id);
  }
}
