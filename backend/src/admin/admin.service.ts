import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InspectionJob } from '../inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from '../inspection-rounds/entities/inspection-round.entity';
import {
  DashboardResponse,
  DashboardTaskItem,
} from './dto/dashboard-response.dto';
import { WorkListResponse, WorkListItem } from './dto/work-list-response.dto';

/**
 * AdminService — ดึงข้อมูลสถิติสำหรับหน้า Admin Dashboard
 *
 * ⚠️ Design Decisions:
 * - ใช้ TypeORM `relations` เพื่อป้องกัน N+1 query problem
 * - ไม่ใช้ `any` ทุกที่ตาม Skill Guideline
 * - ป้องกัน Data Leakage โดย strip ข้อมูล sensitive (password) ออกก่อนส่ง
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
  ) {}

  /**
   * ดึงข้อมูล Dashboard สถิติรวมและรายการงานในเดือนที่ระบุ
   * @param dateString - วันที่ในรูปแบบ ISO string (optional, default = เดือนปัจจุบัน)
   */
  async getDashboardData(dateString?: string): Promise<DashboardResponse> {
    // ========================================
    // 1. ดึงสถิติจำนวนงานทั้งหมด (Single Query with relation)
    // ========================================
    const allJobs: InspectionJob[] = await this.jobsRepo.find({
      relations: ['houseType'],
    });

    const totalProjects: number = allJobs.length;
    let inProgress = 0;
    let singleHouse = 0;
    let townhouse = 0;
    let condo = 0;
    let construction = 0;

    for (const job of allJobs) {
      // นับงานที่กำลังดำเนินการ (Active หรือ Draft)
      if (job.status === 'Active' || job.status === 'Draft') {
        inProgress++;
      }

      // จำแนกประเภทบ้านจากชื่อ HouseType
      const houseTypeName: string = job.houseType?.name ?? '';

      if (houseTypeName.includes('บ้านเดี่ยว')) {
        singleHouse++;
      } else if (
        houseTypeName.includes('ทาวน์โฮม') ||
        houseTypeName.includes('ทาวน์เฮาส์')
      ) {
        townhouse++;
      } else if (houseTypeName.includes('คอนโด')) {
        condo++;
      } else if (houseTypeName.includes('ก่อสร้าง')) {
        construction++;
      }
    }

    // ========================================
    // 2. ดึงรอบตรวจ (InspectionRound) ของเดือนที่ต้องการ
    //    พร้อม eager load relations เพื่อป้องกัน N+1 problem
    // ========================================
    const targetDate: Date = dateString ? new Date(dateString) : new Date();
    const year: number = targetDate.getFullYear();
    const month: number = targetDate.getMonth();

    const startOfMonth: Date = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth: Date = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const rounds: InspectionRound[] = await this.roundsRepo.find({
      where: {
        scheduledDate: Between(startOfMonth, endOfMonth),
      },
      relations: [
        'job',
        'job.customer',
        'job.houseType',
        'teamMembers',
        'teamMembers.inspector',
        'teamMembers.inspector.team',
        'teamMembers.team',
      ],
      order: {
        scheduledDate: 'ASC',
      },
    });

    // ========================================
    // 3. แปลง InspectionRound → DashboardTaskItem
    //    พร้อม Map สีและไอคอนตาม Design ของ Frontend
    // ========================================
    const tasks: DashboardTaskItem[] = rounds
      .filter((round: InspectionRound): boolean => round.scheduledDate !== null)
      .map((round: InspectionRound): DashboardTaskItem => {
        // กำหนดสถานะแสดงผลและสีตามสถานะรอบตรวจ
        const statusMapping = this.mapRoundStatus(round.status);

        // กำหนดไอคอนตามประเภทบ้าน
        const iconMapping = this.mapHouseTypeIcon(
          round.job?.houseType?.name ?? '',
        );

        // ดึงชื่อทีม (strip sensitive data — ไม่ส่ง password ของ inspector)
        const firstTeamMember = round.teamMembers?.[0];
        const teamName: string =
          firstTeamMember?.team?.team_name ??
          firstTeamMember?.inspector?.team?.team_name ?? 
          'ยังไม่ระบุทีม';

        // ดึงชื่อลูกค้า
        const customerName: string =
          round.job?.customer?.fullName ?? 'ยังไม่ระบุลูกค้า';

        // แปลง scheduledDate เป็น Date object อย่างปลอดภัย
        // (PostgreSQL อาจส่งกลับเป็น string หรือ Date ขึ้นกับ driver)
        const scheduledDate: Date = new Date(round.scheduledDate);

        // สร้าง meta text แสดงชื่อทีมและเวลา
        const timeStr: string = !isNaN(scheduledDate.getTime())
          ? scheduledDate.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Bangkok',
            })
          : '';

        const meta: string = `${teamName} • ${timeStr || 'ยังไม่ระบุเวลา'}`;

        // ดึงวันที่ตาม timezone ไทย (UTC+7) เพื่อให้ตรงกับปฏิทินของ Frontend
        const dayOfMonth: number = !isNaN(scheduledDate.getTime())
          ? parseInt(
              scheduledDate.toLocaleDateString('en-US', {
                day: 'numeric',
                timeZone: 'Asia/Bangkok',
              }),
              10,
            )
          : 0;

        return {
          id: round.roundId,
          title: round.job?.projectName ?? 'ไม่ระบุโครงการ',
          meta,
          status: statusMapping.displayStatus,
          statusBgClass: statusMapping.statusBgClass,
          statusTextColor: statusMapping.statusTextColor,
          icon: iconMapping.icon,
          avatarBgClass: iconMapping.avatarBgClass,
          avatarTextColor: iconMapping.avatarTextColor,
          day: dayOfMonth,
          team: teamName,
          customer: customerName,
        };
      })
      .filter((task: DashboardTaskItem): boolean => task.day > 0);

    return {
      totalProjects,
      inProgress,
      singleHouse,
      townhouse,
      condo,
      construction,
      tasks,
    };
  }

  /**
   * ดึงข้อมูลรายการทำงานทั้งหมดสำหรับหน้า Admin Work List
   * นำข้อมูลจาก InspectionJob และ InspectionRound มาเชื่อมโยงกันใน memory
   * เพื่อป้องกัน N+1 query problem
   */
  async getAllWorkList(): Promise<WorkListResponse> {
    // 1. ดึงข้อมูลงานทั้งหมด
    const allJobs: InspectionJob[] = await this.jobsRepo.find({
      relations: ['customer', 'houseType'],
      order: {
        createdAt: 'DESC',
      },
    });

    // 2. ดึงข้อมูลรอบตรวจทั้งหมด (เพื่อหาวันที่นัดและทีม)
    const allRounds: InspectionRound[] = await this.roundsRepo.find({
      relations: [
        'job',
        'teamMembers',
        'teamMembers.inspector',
        'teamMembers.inspector.team',
        'teamMembers.team',
      ],
      order: {
        scheduledDate: 'DESC',
      },
    });

    // 3. จัดกลุ่มรอบตรวจตาม jobId เพื่อดึงรอบล่าสุด
    const roundsByJobId = new Map<number, InspectionRound>();
    for (const round of allRounds) {
      const jId = round.job?.jobId;
      if (jId) {
        // เนื่องจาก query มาเป็น DESC ตัวแรกที่เจอคือรอบที่ล่าสุด
        if (!roundsByJobId.has(jId)) {
          roundsByJobId.set(jId, round);
        }
      }
    }

    // 4. Map ให้เป็นโครงสร้างที่ Frontend ต้องการ
    const workList: WorkListItem[] = allJobs.map(
      (job: InspectionJob): WorkListItem => {
        const latestRound = roundsByJobId.get(job.jobId);

        // กำหนดสถานะและสี
        // ถ้ามีรอบตรวจแล้วใช้สถานะของรอบตรวจ ถ้าไม่มีใช้สถานะของงาน
        let displayStatus = 'ร่าง (Draft)';
        let statusBgClass = 'bg-grey-2';
        let statusTextColor = 'grey-8';
        let statusKey = 'waiting';

        if (latestRound) {
          if (latestRound.status === 'COMPLETED') {
            displayStatus = 'เสร็จสิ้น';
            statusBgClass = 'bg-green-1';
            statusTextColor = 'positive';
            statusKey = 'others';
          } else if (latestRound.status === 'SUBMITTED') {
            displayStatus = 'รออนุมัติ';
            statusBgClass = 'bg-orange-1';
            statusTextColor = 'orange-8';
            statusKey = 'waiting';
          } else {
            displayStatus = 'กำลังดำเนินการ';
            statusBgClass = 'bg-blue-1';
            statusTextColor = 'primary';
            statusKey = 'in_progress';
          }
        } else {
          if (job.status === 'Active') {
            displayStatus = 'กำลังดำเนินการ';
            statusBgClass = 'bg-blue-1';
            statusTextColor = 'primary';
            statusKey = 'in_progress';
          } else if (job.status === 'Completed') {
            displayStatus = 'เสร็จสิ้น';
            statusBgClass = 'bg-green-1';
            statusTextColor = 'positive';
            statusKey = 'others';
          } else if (job.status === 'Cancelled') {
            displayStatus = 'ยกเลิก';
            statusBgClass = 'bg-red-1';
            statusTextColor = 'negative';
            statusKey = 'others';
          }
        }

        // ข้อมูลทีม
        const firstTeamMember = latestRound?.teamMembers?.[0];
        const teamName: string =
          firstTeamMember?.team?.team_name ??
          firstTeamMember?.inspector?.team?.team_name ?? 
          'ไม่ระบุทีม';

        // วันที่จัดรูปแบบให้ Frontend ใช้งานง่าย (ISO String)
        // ถ้ามีรอบนัดหมายให้ใช้วันที่นั้น ถ้ายังไม่มีให้ใช้วันที่สร้างงานแทน
        const dateVal = latestRound?.scheduledDate ?? job.createdAt;
        const dateStr = dateVal ? dateVal.toISOString() : null;

        return {
          id: job.jobId,
          title: job.projectName ?? 'ไม่ระบุโครงการ',
          status: displayStatus,
          statusBgClass,
          statusTextColor,
          statusKey,
          type: job.houseType?.name ?? 'ไม่ระบุประเภท',
          area: job.usableArea ?? 0,
          team: teamName,
          customer: job.customer?.fullName ?? 'ไม่ระบุลูกค้า',
          date: dateStr,
        };
      },
    );

    return workList;
  }

  /**
   * Map สถานะของ InspectionRound → สีและข้อความที่ Frontend ต้องใช้
   */
  private mapRoundStatus(roundStatus: string): {
    displayStatus: string;
    statusBgClass: string;
    statusTextColor: string;
  } {
    switch (roundStatus) {
      case 'SUBMITTED':
        return {
          displayStatus: 'รออนุมัติ',
          statusBgClass: 'bg-orange-1',
          statusTextColor: 'orange-8',
        };
      case 'COMPLETED':
        return {
          displayStatus: 'เสร็จสิ้น',
          statusBgClass: 'bg-green-1',
          statusTextColor: 'positive',
        };
      case 'SCHEDULED':
      default:
        return {
          displayStatus: 'กำลังดำเนินการ',
          statusBgClass: 'bg-blue-1',
          statusTextColor: 'primary',
        };
    }
  }

  /**
   * Map ประเภทบ้าน → ไอคอนและสี Avatar ของ Frontend
   */
  private mapHouseTypeIcon(houseTypeName: string): {
    icon: string;
    avatarBgClass: string;
    avatarTextColor: string;
  } {
    if (houseTypeName.includes('คอนโด')) {
      return {
        icon: 'domain',
        avatarBgClass: 'bg-blue-1',
        avatarTextColor: 'primary',
      };
    }

    if (houseTypeName.includes('ก่อสร้าง')) {
      return {
        icon: 'roofing',
        avatarBgClass: 'bg-purple-1',
        avatarTextColor: 'purple',
      };
    }

    // บ้านเดี่ยว, ทาวน์เฮาส์, ทาวน์โฮม, อื่นๆ
    return {
      icon: 'home',
      avatarBgClass: 'bg-green-1',
      avatarTextColor: 'positive',
    };
  }
}
