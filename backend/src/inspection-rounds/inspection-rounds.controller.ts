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
import { InspectorSelfOrAdminGuard } from 'src/auth/inspector-self-or-admin.guard';
import { ReportsService } from 'src/reports/reports.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';

@Controller('inspection-rounds')
export class InspectionRoundsController {
  constructor(
    private readonly inspectionRoundsService: InspectionRoundsService,
    private readonly reportsService: ReportsService,
    private readonly aiSummaryService: AiSummaryService,
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
  @UseGuards(AuthGuard, InspectorSelfOrAdminGuard)
  findByWeek(
    @Param('inspectorId') inspectorId: string,
    @Query('date') dateString?: string,
  ) {
    return this.inspectionRoundsService.findByWeek(+inspectorId, dateString);
  }

  @Get('month/:inspectorId')
  @UseGuards(AuthGuard, InspectorSelfOrAdminGuard)
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
  // ส่ง generatedAt กลับไปด้วยให้ UI โชว์ได้ว่าไฟล์นี้ข้อมูล ณ เวลาไหน (PDF อาจล้าหลังการแก้ defect ล่าสุดได้)
  @Get(':id/report')
  @UseGuards(AuthGuard)
  getReport(@Param('id') id: string) {
    return this.reportsService.getCachedReportUrl(+id);
  }

  // สั่งสร้างสรุปท้ายเล่มใหม่แบบ manual เลือก provider เอง (เช่นปุ่ม "สร้างสรุปใหม่" ในหน้า admin)
  // ไม่ผ่านการเช็ค hash เหมือน flow อัตโนมัติที่ผูกกับการ regenerate PDF
  @Post(':id/ai-summary/generate')
  @UseGuards(AuthGuard)
  generateAiSummary(
    @Param('id') id: string,
    @Body('provider') provider: string,
  ) {
    return this.aiSummaryService.generateWithProvider(+id, provider);
  }

  @Patch(':id/confirm-inspection')
  @UseGuards(RoundAccessGuard)
  confirmInspection(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmInspection(+id);
  }

  @Patch(':id/confirm-summary')
  @UseGuards(RoundAccessGuard)
  confirmSummary(@Param('id') id: string) {
    return this.inspectionRoundsService.confirmSummary(+id);
  }

  @Patch(':id/submit')
  @UseGuards(RoundAccessGuard)
  submit(@Param('id') id: string) {
    return this.inspectionRoundsService.submit(+id);
  }

  @Patch(':id/approve')
  @UseGuards(RoundAccessGuard)
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }

  @Patch(':id')
  @UseGuards(RoundAccessGuard)
  update(
    @Param('id') id: string,
    @Body() updateInspectionRoundDto: UpdateInspectionRoundDto,
  ) {
    return this.inspectionRoundsService.update(+id, updateInspectionRoundDto);
  }

  @Delete(':id')
  @UseGuards(RoundAccessGuard)
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
  @UseGuards(RoundAccessGuard)
  approve(@Param('id') id: string) {
    return this.inspectionRoundsService.approveReport(+id);
  }
}
