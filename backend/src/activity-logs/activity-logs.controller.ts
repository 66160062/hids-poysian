import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { JobAccessGuard } from 'src/auth/job-access.guard';

@ApiTags('activity-logs')
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get(':jobId')
  @UseGuards(JobAccessGuard)
  @ApiOperation({ summary: 'ดึงประวัติกิจกรรมล่าสุดของงานตรวจ' })
  findByJob(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.activityLogsService.findByJob(jobId);
  }
}
