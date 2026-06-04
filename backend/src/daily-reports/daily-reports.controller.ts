import { Body, Controller, Param, Post } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { CreateDailyReportRoundDto } from './dto/create-daily-report-round.dto';

@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  create(@Body() createDailyReportDto: CreateDailyReportDto) {
    return this.dailyReportsService.create(createDailyReportDto);
  }

  @Post(':id/rounds')
  createRound(
    @Param('id') id: string,
    @Body() createRoundDto: CreateDailyReportRoundDto,
  ) {
    return this.dailyReportsService.createRound(+id, createRoundDto);
  }
}
