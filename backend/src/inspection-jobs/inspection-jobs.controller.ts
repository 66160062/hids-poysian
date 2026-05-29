import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { InspectionJobStatus } from './enums/inspection-job-status.enum';

@Controller('inspection-jobs')
export class InspectionJobsController {
  constructor(private readonly inspectionJobsService: InspectionJobsService) { }

  @Post()
  @ApiOperation({ summary: 'การตรวจใหม่' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลการตรวจ', type: CreateInspectionJobDto })
  @UseInterceptors(
    FileInterceptor('projectImageUrl', {
      storage: diskStorage({
        destination: './uploads/inspection_jobs',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createInspectionJobDto: CreateInspectionJobDto,
  ) {
    return this.inspectionJobsService.create({
      ...createInspectionJobDto,
      projectImageUrl: file
        ? '/uploads/inspection_jobs/' + file.filename
        : '/uploads/inspection_jobs/unknown.jpg',
    });
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status',
      new ParseEnumPipe(InspectionJobStatus, { optional: true })
    ) status?: InspectionJobStatus
  ) {
    return this.inspectionJobsService.findAll(Number(page) || 1, Number(limit) || 10, status);
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
    FileInterceptor('projectImageUrl', {
      storage: diskStorage({
        destination: './uploads/inspection_jobs',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateInspectionJobDto: UpdateInspectionJobDto,
  ) {
    return this.inspectionJobsService.update(+id, {
      ...updateInspectionJobDto,
      projectImageUrl: file
        ? '/uploads/inspection_jobs/' + file.filename
        : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionJobsService.remove(+id);
  }
}
