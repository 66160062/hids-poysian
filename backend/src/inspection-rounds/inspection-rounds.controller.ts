import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';

@Controller('inspection-rounds')
export class InspectionRoundsController {
  constructor(
    private readonly inspectionRoundsService: InspectionRoundsService,
  ) {}

  @Post()
  create(@Body() createInspectionRoundDto: CreateInspectionRoundDto) {
    return this.inspectionRoundsService.create(createInspectionRoundDto);
  }

  @Get()
  findAll() {
    return this.inspectionRoundsService.findAll();
  }

  @Get('week/:inspectorId')
  findByWeek(@Param('inspectorId') inspectorId: string) {
    return this.inspectionRoundsService.findByWeek(+inspectorId);
  }

  @Get('month/:inspectorId')
  async getRoundsByMonth(
    @Param('inspectorId') inspectorId: number,
    @Query('date') dateString?: string,
  ) {
    return this.inspectionRoundsService.findByMonth(inspectorId, dateString);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionRoundsService.findOne(+id);
  }

  @Patch(':id/confirm-inspection')
  confirmInspection(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmInspection(+id);
  }

  @Patch(':id/confirm-summary')
  confirmSummary(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmSummary(+id);
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string) {
    return this.inspectionRoundsService.submit(+id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionRoundDto: UpdateInspectionRoundDto,
  ) {
    return this.inspectionRoundsService.update(+id, updateInspectionRoundDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionRoundsService.remove(+id);
  }
}

@Controller('projects')
export class ProjectApprovalController {
  constructor(
    private readonly inspectionRoundsService: InspectionRoundsService,
  ) {}

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }
}
