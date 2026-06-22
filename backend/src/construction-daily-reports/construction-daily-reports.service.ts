import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { ConstructionDailyReport } from './entities/construction-daily-report.entity';
import { DailyWorkItem } from './entities/daily-work-item.entity';
import { DailyPersonnel } from './entities/daily-personnel.entity';
import { DailyIssue } from './entities/daily-issue.entity';
import { AccidentReport } from './entities/accident-report.entity';
import { DailyMachine } from './entities/daily-machine.entity';
import { CreateConstructionDailyReportDto } from './dto/create-construction-daily-report.dto';

import { DailyReportImage } from './entities/daily-report-image.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ConstructionDailyReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    payloadStr: string,
    photoWorkDetailNames: string | string[],
    files: {
      panoramaFile?: Express.Multer.File[];
      photos?: Express.Multer.File[];
    },
    userId?: number,
  ): Promise<ConstructionDailyReport> {
    const dto = JSON.parse(payloadStr) as CreateConstructionDailyReportDto;
    return this.dataSource.transaction(async (manager) => {
      // 1. ตรวจสอบว่า round มีอยู่จริง
      const round = await manager
        .getRepository(InspectionRound)
        .findOneBy({ roundId: dto.roundId });

      if (!round) {
        throw new NotFoundException(`ไม่พบรอบการตรวจ ID ${dto.roundId}`);
      }

      if (!round.inspectedAt) {
        round.inspectedAt = new Date();
        await manager.getRepository(InspectionRound).save(round);
      }

      // 2. สร้าง daily_report (ตารางหลัก)
      const report: ConstructionDailyReport = manager
        .getRepository(ConstructionDailyReport)
        .create({
          round,
          reportDate: dto.reportDate,
          weather: dto.weather,
          workingPeriod: dto.workingPeriod,
          contractorName: dto.contractorName,
          reporterName: dto.reporterName,
          position: dto.position,
          createdBy: userId ? ({ id: userId } as User) : undefined,
        });
      const savedReport: ConstructionDailyReport = await manager
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

      // 6. สร้าง accident_report[] (ตารางย่อย)
      if (dto.accidents && dto.accidents.length > 0) {
        const accidents = dto.accidents.map((a) =>
          manager.getRepository(AccidentReport).create({
            dailyReport: savedReport,
            accidentCount: a.accidentCount,
            description: a.description,
          }),
        );
        await manager.getRepository(AccidentReport).save(accidents);
      }

      // 7. สร้าง daily_machine[] (ตารางย่อย)
      if (dto.machines && dto.machines.length > 0) {
        const machines = dto.machines.map((m) =>
          manager.getRepository(DailyMachine).create({
            dailyReport: savedReport,
            machineSize: m.machineSize,
            quantity: m.quantity ?? 1,
            workingHours: m.workingHours,
          }),
        );
        await manager.getRepository(DailyMachine).save(machines);
      }

      // 7.5 บันทึกรูปภาพ (daily_report_image)
      const images: DailyReportImage[] = [];
      let sequenceCount = 1;

      if (files?.panoramaFile?.[0]) {
        images.push(
          manager.getRepository(DailyReportImage).create({
            dailyReport: savedReport,
            sequence: sequenceCount++,
            imageType: 'PANORAMA',
            imageUrl: `/uploads/${files.panoramaFile[0].filename}`,
            caption: 'Panorama View',
          }),
        );
      }

      if (files?.photos && files.photos.length > 0) {
        const names = Array.isArray(photoWorkDetailNames)
          ? photoWorkDetailNames
          : [photoWorkDetailNames];
        files.photos.forEach((file, index) => {
          images.push(
            manager.getRepository(DailyReportImage).create({
              dailyReport: savedReport,
              sequence: sequenceCount++,
              imageType: 'WORK_DETAIL',
              imageUrl: `/uploads/${file.filename}`,
              caption: names[index] || '',
            }),
          );
        });
      }

      if (images.length > 0) {
        await manager.getRepository(DailyReportImage).save(images);
      }

      // 8. โหลดข้อมูลกลับมาพร้อม relations ทั้งหมด
      return manager.getRepository(ConstructionDailyReport).findOneOrFail({
        where: { dailyReportId: savedReport.dailyReportId },
        relations: [
          'round',
          'round.job',
          'workItems',
          'personnels',
          'issues',
          'accidents',
          'machines',
          'images',
          'createdBy',
        ],
      });
    });
  }

  async findByRound(roundId: number): Promise<ConstructionDailyReport | null> {
    const report = await this.dataSource
      .getRepository(ConstructionDailyReport)
      .findOne({
        where: { round: { roundId } },
        relations: [
          'round',
          'round.job',
          'workItems',
          'personnels',
          'issues',
          'accidents',
          'machines',
          'images',
          'createdBy',
        ],
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
