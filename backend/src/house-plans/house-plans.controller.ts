import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HousePlansService } from './house-plans.service';
import { CreateHousePlanDto } from './dto/create-house-plan.dto';
import { UpdateHousePlanDto } from './dto/update-house-plan.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { JobAccessGuard } from 'src/auth/job-access.guard';

@ApiTags('house-plans')
@Controller()
export class HousePlansController {
  constructor(private readonly housePlansService: HousePlansService) {}

  @Get('jobs/:jobId/house-plans')
  @UseGuards(JobAccessGuard)
  @ApiOperation({ summary: 'ดึงรายการแปลนทั้งหมดของงานตรวจ' })
  findByJob(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.housePlansService.findByJob(jobId);
  }

  @Get('inspection-jobs/:jobId/house-plans')
  @UseGuards(JobAccessGuard)
  @ApiOperation({ summary: 'ดึงรายการแปลนทั้งหมดของงานตรวจ (alias)' })
  findByJobAlias(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.housePlansService.findByJob(jobId);
  }

  @Post('jobs/:jobId/house-plans')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'อัปโหลดรูปแปลนเพิ่มในงานตรวจ' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @Param('jobId', ParseIntPipe) jobId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateHousePlanDto,
  ) {
    return this.housePlansService.create(jobId, file, dto);
  }

  @Post('inspection-jobs/:jobId/house-plans')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'อัปโหลดรูปแปลนเพิ่มในงานตรวจ (alias)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  createAlias(
    @Param('jobId', ParseIntPipe) jobId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateHousePlanDto,
  ) {
    return this.housePlansService.create(jobId, file, dto);
  }

  @Patch('house-plans/:planId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'แก้ไขชื่อแปลน' })
  update(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() dto: UpdateHousePlanDto,
  ) {
    return this.housePlansService.update(planId, dto);
  }

  @Delete('house-plans/:planId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'ลบรูปแปลน' })
  remove(@Param('planId', ParseIntPipe) planId: number) {
    return this.housePlansService.remove(planId);
  }
}
