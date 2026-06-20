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

      // จำแนกประเภทงาน (ตรวจบ้าน / ก่อสร้าง)
      const inspectionType = job.inspectionType || '';
      if (
        inspectionType === 'CONSTRUCTION_INSPECTION' ||
        inspectionType === 'ตรวจก่อสร้าง' ||
        inspectionType === 'Construction' ||
        inspectionType === 'งานก่อสร้าง'
      ) {
        construction++;
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

    const calendarEvents: number[] = rounds
      .filter((round: InspectionRound): boolean => round.scheduledDate !== null)
      .map((round: InspectionRound): number => {
        const d = new Date(round.scheduledDate);
        return !isNaN(d.getTime())
          ? parseInt(d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Bangkok' }), 10)
          : 0;
      })
      .filter(day => day > 0);

    // ========================================
    // 3. ดึง 15 งานที่ถูกสร้างล่าสุด
    // ========================================
    const recentJobs: InspectionJob[] = await this.jobsRepo.find({
      relations: [
        'customer',
        'houseType',
        'rounds',
        'rounds.teamMembers',
        'rounds.teamMembers.inspector',
        'rounds.teamMembers.inspector.team',
        'rounds.teamMembers.team',
      ],
      order: {
        createdAt: 'DESC',
      },
      take: 15,
    });

    // ========================================
    // 4. แปลง InspectionJob → DashboardTaskItem
    //    พร้อม Map สีและไอคอนตาม Design ของ Frontend
    // ========================================
    const tasks: DashboardTaskItem[] = recentJobs.map((job: InspectionJob): DashboardTaskItem => {
      // ค้นหารอบตรวจล่าสุดเพื่อดึงข้อมูล (เรียงจาก id มากไปน้อย)
      let latestRound: InspectionRound | null = null;
      if (job.rounds && job.rounds.length > 0) {
        const sortedRounds = [...job.rounds].sort((a, b) => b.roundId - a.roundId);
        latestRound = sortedRounds[0];
      }

      // กำหนดสถานะแสดงผลและสี (ใช้สถานะรอบตรวจ ถ้าไม่มีใช้สถานะงาน)
      const statusMapping = latestRound ? this.mapRoundStatus(latestRound.status) : this.mapJobStatus(job.status);

        const iconMapping = this.mapHouseTypeIcon(job.houseType?.name ?? '');

        // ดึงชื่อทีม
        const firstTeamMember = latestRound?.teamMembers?.[0];
        const teamName: string =
          firstTeamMember?.team?.team_name ??
          firstTeamMember?.inspector?.team?.team_name ?? 
          'ยังไม่ระบุทีม';

        // ดึงชื่อลูกค้า
        const customerName: string = job.customer?.fullName ?? 'ยังไม่ระบุลูกค้า';

        // แปลง scheduledDate เป็น Date object อย่างปลอดภัย
        // แปลงวันที่อ้างอิง: ถ้ามีรอบตรวจใช้วันที่นัดหมาย, ถ้าไม่มีใช้วันที่สร้างงาน
        const referenceDate: Date = latestRound?.scheduledDate
          ? new Date(latestRound.scheduledDate)
          : new Date(job.createdAt);

        // วันที่จัดรูปแบบให้ Frontend ใช้งานง่าย
        const dateStr = !isNaN(referenceDate.getTime()) 
          ? referenceDate.toLocaleDateString('th-TH', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'Asia/Bangkok'
            })
          : 'ยังไม่ระบุวันที่';

        const timeStr: string = !isNaN(referenceDate.getTime())
          ? referenceDate.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Bangkok',
            })
          : '';

        const meta: string = `${dateStr} • ${timeStr || 'ยังไม่ระบุเวลา'}`;

        // ดึงวันที่ตาม timezone ไทย (UTC+7) เพื่อให้ตรงกับปฏิทินของ Frontend
        const dayOfMonth: number = !isNaN(referenceDate.getTime())
          ? parseInt(
              referenceDate.toLocaleDateString('en-US', {
                day: 'numeric',
                timeZone: 'Asia/Bangkok',
              }),
              10,
            )
          : 0;

        return {
          id: latestRound?.roundId ?? job.jobId,
          jobId: job.jobId ?? 0,
          inspectionType: job.inspectionType ?? '',
          title: job.projectName ?? 'ไม่ระบุโครงการ',
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
      });

    return {
      totalProjects,
      inProgress,
      singleHouse,
      townhouse,
      condo,
      construction,
      calendarEvents,
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
  private mapRoundStatus(status: string): {
    displayStatus: string;
    statusBgClass: string;
    statusTextColor: string;
  } {
    if (status === 'COMPLETED') {
      return {
        displayStatus: 'เสร็จสิ้น',
        statusBgClass: 'bg-green-1',
        statusTextColor: 'positive',
      };
    } else if (status === 'SUBMITTED') {
      return {
        displayStatus: 'รออนุมัติ',
        statusBgClass: 'bg-orange-1',
        statusTextColor: 'orange-8',
      };
    } else {
      return {
        displayStatus: 'กำลังดำเนินการ',
        statusBgClass: 'bg-blue-1',
        statusTextColor: 'primary',
      };
    }
  }

  /**
   * Map สถานะของ InspectionJob → สีและข้อความที่ Frontend ต้องใช้ (กรณีที่ยังไม่มีรอบนัดหมาย)
   */
  private mapJobStatus(status: string) {
    if (status === 'Active') {
      return {
        displayStatus: 'กำลังดำเนินการ',
        statusBgClass: 'bg-blue-1',
        statusTextColor: 'primary',
      };
    } else if (status === 'Completed') {
      return {
        displayStatus: 'เสร็จสิ้น',
        statusBgClass: 'bg-green-1',
        statusTextColor: 'positive',
      };
    } else if (status === 'Cancelled') {
      return {
        displayStatus: 'ยกเลิก',
        statusBgClass: 'bg-red-1',
        statusTextColor: 'negative',
      };
    } else {
      return {
        displayStatus: 'ร่าง (Draft)',
        statusBgClass: 'bg-grey-2',
        statusTextColor: 'grey-8',
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
