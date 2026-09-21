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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InspectionRoundsService } from './inspection-rounds.service';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { UpdateJobInfoDto } from './dto/update-job-info.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { InspectorSelfOrAdminGuard } from 'src/auth/inspector-self-or-admin.guard';
import { ReportsService, ReportLocale } from 'src/reports/reports.service';
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

  // เช็ค cache PDF เดิม ไม่ trigger การ generate ใดๆ ทั้งสิ้น (ยกเว้น lang=en-US ที่ยัง lazy-generate ครั้งแรก ดู ReportsService)
  // ส่ง generatedAt กลับไปด้วยให้ UI โชว์ได้ว่าไฟล์นี้ข้อมูล ณ เวลาไหน (PDF อาจล้าหลังการแก้ defect ล่าสุดได้)
  @Get(':id/report')
  @UseGuards(AuthGuard)
  getReport(@Param('id') id: string, @Query('lang') lang?: string) {
    const locale: ReportLocale = lang === 'en-US' ? 'en-US' : 'th-TH';
    return this.reportsService.getCachedReportUrl(+id, locale);
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

  // จุดที่ inspector บอกว่า "ตรวจ/แก้ไขรอบนี้เสร็จแล้ว" — ก่อนหน้านี้ defect แต่ละตัวที่เพิ่ม/แก้/ลบ
  // ระหว่างตรวจไม่ trigger regenerate แล้ว (ดู DefectsController.maybeScheduleRegeneration) ต้องมา
  // trigger รวมทีเดียวตรงนี้แทน ไม่งั้นรอบที่เพิ่งตรวจเสร็จจะไม่มี PDF/AI summary ใหม่ให้เลย
  @Patch(':id/confirm-inspection')
  @UseGuards(RoundAccessGuard)
  async confirmInspection(@Param('id') id: string) {
    const round = await this.inspectionRoundsService.confirmInspection(+id);
    this.reportsService.scheduleRegeneration(+id);
    return round;
  }

  // แบบสรุปการตรวจขึ้นเป็นหน้าสรุปในเล่มรายงานด้วย (ดู ReportsService.computeDataHash) — ปกติ item
  // แต่ละตัวสั่ง regenerate มาตั้งแต่ตอนกรอกแล้ว (ดู InspectionSummaryItemsController) ตรงนี้เป็นตาข่ายกันตกอีกชั้น
  @Patch(':id/confirm-summary')
  @UseGuards(RoundAccessGuard)
  async confirmSummary(@Param('id') id: string) {
    const round = await this.inspectionRoundsService.confirmSummary(+id);
    this.reportsService.scheduleRegeneration(+id);
    return round;
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

  // endpoint แบบจำกัดสิทธิ์: แก้ได้แค่ "ข้อมูลผู้รับเหมา + รูปหน้าโครงการ" ของ job
  // ที่รอบนี้สังกัด — ให้ inspector ที่ถูก assign เข้ารอบนี้ (หรือ admin) เติม/แก้ข้อมูลที่ office
  // อาจกรอกไม่ครบตอนสร้างงานได้ โดยไม่เปิดช่องให้แก้ field อื่นของ job เหมือน admin
  @Patch(':id/job-info')
  @UseGuards(RoundAccessGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'projectImageUrl', maxCount: 1 }],
      { storage: memoryStorage() },
    ),
  )
  updateJobInfo(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      projectImageUrl?: Express.Multer.File[];
    },
    @Body() updateJobInfoDto: UpdateJobInfoDto,
  ) {
    return this.inspectionRoundsService.updateJobInfo(
      +id,
      updateJobInfoDto,
      files,
    );
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
