import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { ConstructionDailyReport } from './entities/construction-daily-report.entity';
import { DailyWorkItem } from './entities/daily-work-item.entity';
import { DailyPersonnel } from './entities/daily-personnel.entity';
import { DailyIssue } from './entities/daily-issue.entity';
import { CreateConstructionDailyReportDto } from './dto/create-construction-daily-report.dto';

@Injectable()
export class ConstructionDailyReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    dto: CreateConstructionDailyReportDto,
  ): Promise<ConstructionDailyReport> {
    return this.dataSource.transaction(async (manager) => {
      // 1. ตรวจสอบว่า round มีอยู่จริง
      const round = await manager
        .getRepository(InspectionRound)
        .findOneBy({ roundId: dto.roundId });

      if (!round) {
        throw new NotFoundException(`ไม่พบรอบการตรวจ ID ${dto.roundId}`);
      }

      // 2. สร้าง daily_report (ตารางหลัก)
      const report = manager.getRepository(ConstructionDailyReport).create({
        round,
        reportDate: dto.reportDate,
        weather: dto.weather,
        workingPeriod: dto.workingPeriod,
        contractorName: dto.contractorName,
        reporterName: dto.reporterName,
        position: dto.position,
      });
      const savedReport = await manager
        .getRepository(ConstructionDailyReport)
        .save(report);

      // 3. สร้าง daily_work_item[] (ตารางย่อย)
      if (dto.workItems && dto.workItems.length > 0) {
        const workItems = dto.workItems.map((item, index) =>
          manager.getRepository(DailyWorkItem).create({
            dailyReport: savedReport,
            sequence: item.sequence ?? index + 1,
            location: item.location,
            description: item.description,
            unit: item.unit,
            plannedPercent: item.plannedPercent,
            actualPercent: item.actualPercent,
            remainingPercent: item.remainingPercent,
            note: item.note,
          }),
        );
        await manager.getRepository(DailyWorkItem).save(workItems);
      }

      // 4. สร้าง daily_personnel[] (ตารางย่อย)
      if (dto.personnels && dto.personnels.length > 0) {
        const personnels = dto.personnels.map((p) =>
          manager.getRepository(DailyPersonnel).create({
            dailyReport: savedReport,
            name: p.name,
            type: p.type,
            count: p.count,
            hours: p.hours,
          }),
        );
        await manager.getRepository(DailyPersonnel).save(personnels);
      }

      // 5. สร้าง daily_issue[] (ตารางย่อย)
      if (dto.issues && dto.issues.length > 0) {
        const issues = dto.issues.map((i) =>
          manager.getRepository(DailyIssue).create({
            dailyReport: savedReport,
            description: i.description,
            note: i.note,
          }),
        );
        await manager.getRepository(DailyIssue).save(issues);
      }

      // 6. โหลดข้อมูลกลับมาพร้อม relations ทั้งหมด
      return manager.getRepository(ConstructionDailyReport).findOneOrFail({
        where: { dailyReportId: savedReport.dailyReportId },
        relations: ['round', 'workItems', 'personnels', 'issues'],
      });
    });
  }

  async findByRound(roundId: number): Promise<ConstructionDailyReport | null> {
    const report = await this.dataSource
      .getRepository(ConstructionDailyReport)
      .findOne({
        where: { round: { roundId } },
        relations: ['round', 'workItems', 'personnels', 'issues'],
        order: { createdAt: 'DESC' },
      });

    if (!report) {
      throw new NotFoundException(
        `ไม่พบรายงานก่อสร้างของรอบการตรวจ ID ${roundId}`,
      );
    }

    return report;
  }
}
