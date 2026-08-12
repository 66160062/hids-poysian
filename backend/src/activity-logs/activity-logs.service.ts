import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityLog,
  ActivityLogColor,
  ActivityLogType,
} from './entities/activity-log.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

export interface LogEntryInput {
  type: ActivityLogType;
  color: ActivityLogColor;
  title: string;
  sub?: string | null;
}

export interface ActivityFeedItem {
  activityId: number;
  type: ActivityLogType;
  color: ActivityLogColor;
  title: string;
  sub: string | null;
  createdAt: Date;
}

interface ActivityFeedRow {
  activityId: number;
  type: ActivityLogType;
  color: ActivityLogColor;
  title: string;
  sub: string | null;
  createdAt: Date;
  eventCount: string;
}

// ประเภท event ที่ยุบรวมเป็นแถวเดียวต่อวันแล้วบอกจำนวนต่อท้าย title ได้ (เช่น "พบข้อบกพร่องใหม่ 5 จุด")
const COUNTABLE_UNIT: Partial<Record<ActivityLogType, string>> = {
  [ActivityLogType.DEFECT_CREATED]: 'จุด',
  [ActivityLogType.DEFECT_REPAIRED]: 'จุด',
};

function appendCount(type: ActivityLogType, title: string, count: number): string {
  const unit = COUNTABLE_UNIT[type];
  if (!unit || count <= 1) return title;
  return `${title} ${count} ${unit}`;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
  ) {}

  // เขียน log ตรงๆ เมื่อรู้ jobId อยู่แล้ว (ไม่ query เพิ่ม)
  async log(
    jobId: number,
    entry: LogEntryInput,
    roundId?: number,
  ): Promise<ActivityLog | null> {
    try {
      const log = this.activityLogRepo.create({
        type: entry.type,
        color: entry.color,
        title: entry.title,
        sub: entry.sub ?? null,
        job: { jobId } as InspectionJob,
        round: roundId ? { roundId } : null,
      });
      return await this.activityLogRepo.save(log);
    } catch (error) {
      // การบันทึก activity log ต้องไม่ทำให้ flow หลัก (สร้าง defect, ส่งรายงาน ฯลฯ) ล้มเหลว
      this.logger.error(
        `บันทึก activity log ไม่สำเร็จ (jobId=${jobId})`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  // ใช้เมื่อมีแค่ roundId ในมือ (เช่น จาก defect/report flow) — หา jobId ให้เองจาก round.job
  async logForRound(
    roundId: number,
    entry: LogEntryInput,
  ): Promise<ActivityLog | null> {
    try {
      const round = await this.roundsRepo.findOne({
        where: { roundId },
        relations: ['job'],
      });
      if (!round?.job) return null;
      return this.log(round.job.jobId, entry, roundId);
    } catch (error) {
      this.logger.error(
        `หา jobId จาก roundId=${roundId} เพื่อบันทึก activity log ไม่สำเร็จ`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  // ยุบ event ประเภทเดียวกันในวันเดียวกันให้เหลือแถวเดียว (ตัวล่าสุด) แล้วนับจำนวนต่อท้าย title
  // ด้วย DISTINCT ON + window COUNT ของ Postgres แทนการ GROUP BY เพื่อให้ยังได้ title/sub ของแถวล่าสุดมาด้วย
  async findByJob(jobId: number): Promise<ActivityFeedItem[]> {
    const rows = await this.activityLogRepo
      .createQueryBuilder('log')
      .distinctOn(['log.type', 'DATE(log.createdAt)'])
      .select('log.activityId', 'activityId')
      .addSelect('log.type', 'type')
      .addSelect('log.color', 'color')
      .addSelect('log.title', 'title')
      .addSelect('log.sub', 'sub')
      .addSelect('log.createdAt', 'createdAt')
      .addSelect(
        'COUNT(*) OVER (PARTITION BY log.type, DATE(log.createdAt))',
        'eventCount',
      )
      .where('log.job = :jobId', { jobId })
      .orderBy('log.type', 'ASC')
      .addOrderBy('DATE(log.createdAt)', 'ASC')
      .addOrderBy('log.createdAt', 'DESC')
      .getRawMany<ActivityFeedRow>();

    return rows
      .map((row) => ({
        activityId: row.activityId,
        type: row.type,
        color: row.color,
        title: appendCount(row.type, row.title, Number(row.eventCount)),
        sub: row.sub,
        createdAt: row.createdAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
