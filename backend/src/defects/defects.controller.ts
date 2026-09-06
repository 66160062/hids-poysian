import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DefectsService } from './defects.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { ContractorUpdateDefectDto } from './dto/contractor-update-defect.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LinkTokenGuard } from 'src/auth/link-token.guard';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { DefectAccessGuard } from './guards/defect-access.guard';
import { StorageService } from 'src/storage/storage.service';
import { ReportsService } from 'src/reports/reports.service';
import { Defect } from './entities/defect.entity';

type LinkTokenPayload = {
  project_id: number;
  role: string;
  generation?: number;
};

@Controller('defects')
export class DefectsController {
  constructor(
    private readonly defectsService: DefectsService,
    private readonly storageService: StorageService,
    private readonly reportsService: ReportsService,
  ) {}

  // ก่อนที่รอบตรวจจะถูกยืนยันครั้งแรก (inspectedAt ยังเป็น null) inspector มักเพิ่ม/แก้/ลบ defect
  // รัวๆ ทีละสิบๆ ร้อยรายการระหว่างเดินตรวจ — ถ้า schedule regenerate ทุกครั้งจะยิง Puppeteer/LLM
  // ซ้ำๆ โดยเปล่าประโยชน์ทั้งที่ยังตรวจไม่เสร็จ เลื่อนไป trigger ทีเดียวตอนกดยืนยันแทน
  // (ดู InspectionRoundsController.confirmInspection) ส่วนหลังยืนยันแล้ว (ซ่อม/ตรวจซ้ำ) ยังคง
  // trigger ตามปกติเพราะเป็นการแก้ทีละจุดห่างๆ ไม่ใช่ยิงรัว
  private maybeScheduleRegeneration(defect: Defect): void {
    if (defect.round?.inspectedAt) {
      this.reportsService.scheduleRegeneration(defect.round.roundId);
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDefectDto: CreateDefectDto,
  ) {
    const defect = await this.defectsService.create({
      ...createDefectDto,
      imageUrl: file
        ? await this.storageService.uploadImage(file.buffer, 'defects')
        : undefined,
      imageFileSize: file ? file.size : undefined,
    });
    this.maybeScheduleRegeneration(defect);
    return defect;
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.defectsService.findAll();
  }

  @Get('round/:roundId')
  @UseGuards(RoundAccessGuard)
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.defectsService.findByRound(roundId);
  }

  @Get(':id')
  @UseGuards(DefectAccessGuard)
  findOne(@Param('id') id: string) {
    return this.defectsService.findOne(+id);
  }

  @Put('contractor-update')
  @UseGuards(LinkTokenGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async contractorUpdate(
    @UploadedFile() file: Express.Multer.File,
    @Body() contractorUpdateDto: ContractorUpdateDefectDto,
    @Req() request: Request & { user: LinkTokenPayload },
  ) {
    const defect = await this.defectsService.contractorUpdate({
      ...contractorUpdateDto,
      linkPayload: request.user,
      ...(file && {
        contractorImageUrl: await this.storageService.uploadImage(
          file.buffer,
          'defects',
        ),
        contractorImageFileSize: file.size,
      }),
    });
    this.maybeScheduleRegeneration(defect);
    return defect;
  }

  @Patch(':id')
  @UseGuards(DefectAccessGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateDefectDto: UpdateDefectDto,
  ) {
    const defect = await this.defectsService.update(id, {
      ...updateDefectDto,
      ...(file && {
        imageUrl: await this.storageService.uploadImage(file.buffer, 'defects'),
        imageFileSize: file.size,
      }),
    });
    this.maybeScheduleRegeneration(defect);
    return defect;
  }

  @Delete(':id')
  @UseGuards(DefectAccessGuard)
  async remove(@Param('id') id: string) {
    const defect = await this.defectsService.remove(+id);
    this.maybeScheduleRegeneration(defect);
    return defect;
  }
}
