import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { Request } from 'express';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('construction-daily-reports')
@Controller('construction-daily-reports')
export class ConstructionDailyReportsController {
  constructor(private readonly service: ConstructionDailyReportsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary:
      'สร้างรายงานก่อสร้างประจำวัน (บันทึกทุกตารางใน Transaction พร้อมรูปภาพ)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        payload: {
          type: 'string',
          description: 'JSON string ของ CreateConstructionDailyReportDto',
        },
        panoramaFile: { type: 'string', format: 'binary' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
        photoWorkDetailNames: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'panoramaFile', maxCount: 1 },
        { name: 'photos', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
            cb(null, uniqueName);
          },
        }),
      },
    ),
  )
  create(
    @Body('payload') payloadStr: string,
    @Body('photoWorkDetailNames') photoWorkDetailNames: string | string[],
    @UploadedFiles()
    files: {
      panoramaFile?: Express.Multer.File[];
      photos?: Express.Multer.File[];
    },
    @Req() req: Request & { user?: { sub: number } },
  ) {
    const userId = req.user?.sub;
    return this.service.create(payloadStr, photoWorkDetailNames, files, userId);
  }

  @Get('round/:roundId')
  @ApiOperation({ summary: 'ดึงรายงานก่อสร้างล่าสุดตาม roundId' })
  findByRound(@Param('roundId') roundId: string) {
    return this.service.findByRound(+roundId);
  }
}
