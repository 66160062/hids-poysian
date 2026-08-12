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
  UseGuards,
} from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { ReportsService } from 'src/reports/reports.service';

@Controller('inspection-rounds')
export class InspectionRoundsController {
  constructor(
    private readonly inspectionRoundsService: InspectionRoundsService,
    private readonly reportsService: ReportsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createInspectionRoundDto: CreateInspectionRoundDto) {
    return this.inspectionRoundsService.create(createInspectionRoundDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.inspectionRoundsService.findAll();
  }

  @Get('week/:inspectorId')
  @UseGuards(AuthGuard)
  findByWeek(
    @Param('inspectorId') inspectorId: string,
    @Query('date') dateString?: string,
  ) {
    return this.inspectionRoundsService.findByWeek(+inspectorId, dateString);
  }

  @Get('month/:inspectorId')
  @UseGuards(AuthGuard)
  async getRoundsByMonth(
    @Param('inspectorId') inspectorId: string,
    @Query('date') dateString?: string,
  ) {
    return this.inspectionRoundsService.findByMonth(+inspectorId, dateString);
  }

  // ทั้ง staff (Bearer) และเจ้าของลิงก์ลูกค้า/ผู้รับเหมา (?token=) เรียกใช้ตัวนี้ร่วมกัน —
  // ดูรายละเอียดรอบตรวจ, ใช้เตรียมข้อมูล export PDF ฝั่งลูกค้าด้วย
  @Get(':id')
  @UseGuards(RoundAccessGuard)
  findOne(@Param('id') id: string) {
    return this.inspectionRoundsService.findOne(+id);
  }

  // เช็ค cache PDF เดิม ไม่ trigger การ generate ใดๆ ทั้งสิ้น
  @Get(':id/report')
  @UseGuards(AuthGuard)
  async getReport(@Param('id') id: string) {
    const url = await this.reportsService.getCachedReportUrl(+id);
    return { url };
  }

  @Patch(':id/confirm-inspection')
  @UseGuards(AuthGuard)
  confirmInspection(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmInspection(+id);
  }

  @Patch(':id/confirm-summary')
  @UseGuards(AuthGuard)
  confirmSummary(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmSummary(+id);
  }

  @Patch(':id/submit')
  @UseGuards(AuthGuard)
  submit(@Param('id') id: string) {
    return this.inspectionRoundsService.submit(+id);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard)
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateInspectionRoundDto: UpdateInspectionRoundDto,
  ) {
    return this.inspectionRoundsService.update(+id, updateInspectionRoundDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.inspectionRoundsService.remove(+id);
  }
}

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectApprovalController {
  constructor(
    private readonly inspectionRoundsService: InspectionRoundsService,
  ) {}

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }
}
