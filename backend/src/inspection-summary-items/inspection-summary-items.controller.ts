import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { SummaryItemAccessGuard } from './guards/summary-item-access.guard';

@Controller('inspection-summary-items')
export class InspectionSummaryItemsController {
  constructor(
    private readonly inspectionSummaryItemsService: InspectionSummaryItemsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createInspectionSummaryItemDto: CreateInspectionSummaryItemDto,
  ) {
    return this.inspectionSummaryItemsService.create(
      createInspectionSummaryItemDto,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.inspectionSummaryItemsService.findAll();
  }

  @Get('round/:roundId')
  @UseGuards(RoundAccessGuard)
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.findByRound(roundId);
  }

  @Get(':id')
  @UseGuards(SummaryItemAccessGuard)
  findOne(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(SummaryItemAccessGuard)
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
  @UseGuards(RoundAccessGuard)
  deleteByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.deleteByRound(roundId);
  }

  @Delete('round/:roundId/template/:templateId')
  @UseGuards(RoundAccessGuard)
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
  @UseGuards(SummaryItemAccessGuard)
  remove(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.remove(+id);
  }
}
