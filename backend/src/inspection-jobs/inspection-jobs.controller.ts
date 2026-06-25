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
  ParseEnumPipe,
} from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { InspectionJobStatus } from './enums/inspection-job-status.enum';
import { AuthService } from 'src/auth/auth.service';

@Controller('inspection-jobs')
export class InspectionJobsController {
  constructor(
    private readonly inspectionJobsService: InspectionJobsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'การตรวจใหม่' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลการตรวจ', type: CreateInspectionJobDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'projectImageUrl', maxCount: 1 },
        { name: 'housePlanUrl', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/inspection_jobs',
          filename: (req, file, cb) => {
            const uniqueFileName = uuidv4() + extname(file.originalname);
            cb(null, uniqueFileName);
          },
        }),
      },
    ),
  )
  create(
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
        ? '/uploads/inspection_jobs/' + projectImage.filename
        : '/uploads/inspection_jobs/unknown.jpg',
      housePlanUrl: housePlan
        ? '/uploads/inspection_jobs/' + housePlan.filename
        : createInspectionJobDto.housePlanUrl || '',
    });
  }

  @Get()
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
  @ApiOperation({ summary: 'สถานะลิงก์แชร์สำหรับผู้รับเหมา' })
  getContractorShareStatus(@Param('id') id: string) {
    return this.authService.getContractorShareStatus(+id);
  }

  @Patch(':id/contractor-share/revoke')
  @ApiOperation({ summary: 'ปิดลิงก์แชร์สำหรับผู้รับเหมา' })
  revokeContractorShare(@Param('id') id: string) {
    return this.authService.revokeContractorShare(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionJobsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตการตรวจ' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลการตรวจ', type: UpdateInspectionJobDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'projectImageUrl', maxCount: 1 },
        { name: 'housePlanUrl', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/inspection_jobs',
          filename: (req, file, cb) => {
            const uniqueFileName = uuidv4() + extname(file.originalname);
            cb(null, uniqueFileName);
          },
        }),
      },
    ),
  )
  update(
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
        ? '/uploads/inspection_jobs/' + projectImage.filename
        : updateInspectionJobDto.projectImageUrl,
      housePlanUrl: housePlan
        ? '/uploads/inspection_jobs/' + housePlan.filename
        : updateInspectionJobDto.housePlanUrl,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionJobsService.remove(+id);
  }
}
