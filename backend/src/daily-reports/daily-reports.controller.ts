import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { CreateDailyReportRoundDto } from './dto/create-daily-report-round.dto';

@ApiTags('daily-reports')
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  create(@Body() createDailyReportDto: CreateDailyReportDto) {
    return this.dailyReportsService.create(createDailyReportDto);
  }

  @Get(':id/rounds')
  @ApiOperation({ summary: 'ดึงรอบการตรวจทั้งหมดของงาน' })
  findRoundsByJob(@Param('id') id: string) {
    return this.dailyReportsService.findRoundsByJob(+id);
  }

  @Post(':id/rounds')
  createRound(
    @Param('id') id: string,
    @Body() createRoundDto: CreateDailyReportRoundDto,
  ) {
    return this.dailyReportsService.createRound(+id, createRoundDto);
  }
}
