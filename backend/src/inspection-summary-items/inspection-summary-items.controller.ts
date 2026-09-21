import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { CreateInspectionSummaryItemPhotoDto } from './dto/create-inspection-summary-item-photo.dto';
import { ReplaceRoundSummaryItemsDto } from './dto/replace-round-summary-items.dto';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { SummaryItemAccessGuard } from './guards/summary-item-access.guard';
import { ReportsService } from 'src/reports/reports.service';

@Controller('inspection-summary-items')
export class InspectionSummaryItemsController {
  constructor(
    private readonly inspectionSummaryItemsService: InspectionSummaryItemsService,
    private readonly reportsService: ReportsService,
  ) {}

  // แบบสรุปการตรวจขึ้นเป็นหน้าสรุปในเล่มรายงาน (ดู summaryPages ใน DefectReport.vue) และช่างกรอกมัน
  // "หลัง" กดยืนยันผลตรวจ ซึ่งเป็นจังหวะที่ PDF ถูก render ไปแล้ว — ถ้าไม่สั่ง regenerate ตรงนี้
  // ไฟล์ที่แนบไปกับอีเมลอนุมัติจะเป็นเล่มที่ไม่มีหน้าสรุป (ดู ReportsService.computeDataHash)
  // ตัว ReportsService debounce + เช็ค hash ให้เองอยู่แล้ว เรียกถี่แค่ไหนก็ไม่ render ซ้ำโดยเปล่าประโยชน์
  private scheduleReportRefresh(roundId: number | null | undefined): void {
    if (!roundId) return;
    this.reportsService.scheduleRegeneration(roundId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createInspectionSummaryItemDto: CreateInspectionSummaryItemDto,
  ) {
    const item = await this.inspectionSummaryItemsService.create(
      createInspectionSummaryItemDto,
    );
    this.scheduleReportRefresh(createInspectionSummaryItemDto.roundId);
    return item;
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateInspectionSummaryItemPhotoDto,
  ) {
    const item = await this.inspectionSummaryItemsService.createPhotoItem(
      file,
      dto,
    );
    this.scheduleReportRefresh(dto.roundId);
    return item;
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

  @Put('round/:roundId')
  @UseGuards(RoundAccessGuard)
  async replaceForRound(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Body() dto: ReplaceRoundSummaryItemsDto,
  ) {
    const items = await this.inspectionSummaryItemsService.replaceForRound(
      roundId,
      dto.items,
    );
    this.scheduleReportRefresh(roundId);
    return items;
  }

  @Get(':id')
  @UseGuards(SummaryItemAccessGuard)
  findOne(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(SummaryItemAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateInspectionSummaryItemDto: UpdateInspectionSummaryItemDto,
  ) {
    const item = await this.inspectionSummaryItemsService.update(
      +id,
      updateInspectionSummaryItemDto,
    );
    this.scheduleReportRefresh(item.roundId);
    return item;
  }

  @Delete('round/:roundId')
  @UseGuards(RoundAccessGuard)
  async deleteByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    const result =
      await this.inspectionSummaryItemsService.deleteByRound(roundId);
    this.scheduleReportRefresh(roundId);
    return result;
  }

  @Delete('round/:roundId/template/:templateId')
  @UseGuards(RoundAccessGuard)
  async deleteByRoundAndTemplate(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    const result =
      await this.inspectionSummaryItemsService.deleteByRoundAndTemplate(
        roundId,
        templateId,
      );
    this.scheduleReportRefresh(roundId);
    return result;
  }

  @Delete(':id')
  @UseGuards(SummaryItemAccessGuard)
  async remove(@Param('id') id: string) {
    const item = await this.inspectionSummaryItemsService.remove(+id);
    this.scheduleReportRefresh(item.roundId);
    return item;
  }
}
