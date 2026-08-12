import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { InspectionJobStatus } from './enums/inspection-job-status.enum';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { JobAccessGuard } from 'src/auth/job-access.guard';
import { StorageService } from 'src/storage/storage.service';

@Controller('inspection-jobs')
export class InspectionJobsController {
  constructor(
    private readonly inspectionJobsService: InspectionJobsService,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'การตรวจใหม่' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลการตรวจ', type: CreateInspectionJobDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'projectImageUrl', maxCount: 1 },
        { name: 'housePlanUrl', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async create(
    @UploadedFiles()
    files: {
      projectImageUrl?: Express.Multer.File[];
      housePlanUrl?: Express.Multer.File[];
    },
    @Body() createInspectionJobDto: CreateInspectionJobDto,
  ) {
    const projectImage = files?.projectImageUrl?.[0];
    const housePlan = files?.housePlanUrl?.[0];

    return this.inspectionJobsService.create({
      ...createInspectionJobDto,
      projectImageUrl: projectImage
        ? await this.storageService.uploadImage(
            projectImage.buffer,
            'inspection_jobs',
          )
        : '/uploads/inspection_jobs/unknown.jpg',
      housePlanUrl: housePlan
        ? await this.storageService.uploadImage(
            housePlan.buffer,
            'inspection_jobs',
          )
        : createInspectionJobDto.housePlanUrl || '',
    });
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('sort') sort?: 'asc' | 'desc',
    @Query('inspectionType') inspectionType?: string,
  ) {
    // Treat 'all' as undefined
    const parsedStatus =
      status === 'all' ? undefined : (status as InspectionJobStatus);

    return this.inspectionJobsService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      parsedStatus,
      search,
      type,
      sort,
      inspectionType,
    );
  }

  @Get('statuses/meta')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'ข้อมูลสถานะงานและจำนวน' })
  getStatusMetadata(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('inspectionType') inspectionType?: string,
  ) {
    return this.inspectionJobsService.getStatusMetadata(
      search,
      type,
      inspectionType,
    );
  }

  @Get(':id/contractor-share')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'สถานะลิงก์แชร์สำหรับผู้รับเหมา' })
  getContractorShareStatus(@Param('id') id: string) {
    return this.authService.getContractorShareStatus(+id);
  }

  @Patch(':id/contractor-share/revoke')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'ปิดลิงก์แชร์สำหรับผู้รับเหมา' })
  revokeContractorShare(@Param('id') id: string) {
    return this.authService.revokeContractorShare(+id);
  }

  // ทั้ง staff (Bearer) และเจ้าของลิงก์ลูกค้า/ผู้รับเหมา (?token=) เรียกใช้ตัวนี้ร่วมกัน
  @Get(':id')
  @UseGuards(JobAccessGuard)
  findOne(@Param('id') id: string) {
    return this.inspectionJobsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'อัปเดตการตรวจ' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลการตรวจ', type: UpdateInspectionJobDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'projectImageUrl', maxCount: 1 },
        { name: 'housePlanUrl', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      projectImageUrl?: Express.Multer.File[];
      housePlanUrl?: Express.Multer.File[];
    },
    @Body() updateInspectionJobDto: UpdateInspectionJobDto,
  ) {
    const projectImage = files?.projectImageUrl?.[0];
    const housePlan = files?.housePlanUrl?.[0];

    return this.inspectionJobsService.update(+id, {
      ...updateInspectionJobDto,
      projectImageUrl: projectImage
        ? await this.storageService.uploadImage(
            projectImage.buffer,
            'inspection_jobs',
          )
        : updateInspectionJobDto.projectImageUrl,
      housePlanUrl: housePlan
        ? await this.storageService.uploadImage(
            housePlan.buffer,
            'inspection_jobs',
          )
        : updateInspectionJobDto.housePlanUrl,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.inspectionJobsService.remove(+id);
  }
}
