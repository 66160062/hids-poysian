import {
  Controller,
  Get,
  Post,
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
import { JobPlansService } from './job-plans.service';
import { CreateJobPlanDto } from './dto/create-job-plan.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { JobAccessGuard } from 'src/auth/job-access.guard';

@ApiTags('job-plans')
@Controller()
export class JobPlansController {
  constructor(private readonly jobPlansService: JobPlansService) {}

  @Get('jobs/:jobId/plans')
  @UseGuards(JobAccessGuard)
  @ApiOperation({ summary: 'ดึงรายการแปลนทั้งหมดของงานตรวจ' })
  findByJob(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.jobPlansService.findByJob(jobId);
  }

  @Get('inspection-jobs/:jobId/plans')
  @UseGuards(JobAccessGuard)
  @ApiOperation({ summary: 'ดึงรายการแปลนทั้งหมดของงานตรวจ (alias)' })
  findByJobAlias(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.jobPlansService.findByJob(jobId);
  }

  @Post('jobs/:jobId/plans')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'อัปโหลดรูปแปลนเพิ่มในงานตรวจ' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @Param('jobId', ParseIntPipe) jobId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateJobPlanDto,
  ) {
    return this.jobPlansService.create(jobId, file, dto);
  }

  @Post('inspection-jobs/:jobId/plans')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'อัปโหลดรูปแปลนเพิ่มในงานตรวจ (alias)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  createAlias(
    @Param('jobId', ParseIntPipe) jobId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateJobPlanDto,
  ) {
    return this.jobPlansService.create(jobId, file, dto);
  }

  @Delete('plans/:planId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'ลบรูปแปลน' })
  remove(@Param('planId', ParseIntPipe) planId: number) {
    return this.jobPlansService.remove(planId);
  }
}
