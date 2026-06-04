import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';

@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Get(':id/clone')
  cloneLatestItems(@Param('id', ParseIntPipe) id: number) {
    return this.dailyReportsService.getLatestItemsForClone(id);
  }
}
