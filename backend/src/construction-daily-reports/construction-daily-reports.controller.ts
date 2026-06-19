import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';
import { CreateConstructionDailyReportDto } from './dto/create-construction-daily-report.dto';

@ApiTags('construction-daily-reports')
@Controller('construction-daily-reports')
export class ConstructionDailyReportsController {
  constructor(private readonly service: ConstructionDailyReportsService) {}

  @Post()
  @ApiOperation({
    summary: 'สร้างรายงานก่อสร้างประจำวัน (บันทึกทุกตารางใน Transaction)',
  })
  create(@Body() dto: CreateConstructionDailyReportDto) {
    return this.service.create(dto);
  }

  @Get('round/:roundId')
  @ApiOperation({ summary: 'ดึงรายงานก่อสร้างล่าสุดตาม roundId' })
  findByRound(@Param('roundId') roundId: string) {
    return this.service.findByRound(+roundId);
  }
}
