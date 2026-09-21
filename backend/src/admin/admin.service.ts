import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { InspectionJob } from '../inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from '../inspection-rounds/entities/inspection-round.entity';
import { Defect } from '../defects/entities/defect.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Team } from '../teams/entities/team.entity';
import {
  DashboardBranchOption,
  DashboardResponse,
  DashboardStatusCode,
  DashboardStatusCount,
  DashboardTaskItem,
  MonthlyTrendItem,
  JobDrilldownItem,
  JobDefectCategoryItem,
  JobDefectResolution,
  TeamWorkloadItem,
  PropertyTypeItem,
} from './dto/dashboard-response.dto';

/** ลำดับการแสดงผลสถานะงานใต้ตัวเลขรวมในการ์ดสรุป */
const STATUS_DISPLAY_ORDER: DashboardStatusCode[] = [
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
  'DRAFT',
];

/** ข้อความไทยของแต่ละสถานะ — Frontend แปลจาก statusCode เอง ส่วนนี้คงไว้ให้ field `status` เดิม */
const STATUS_LABEL_TH: Record<DashboardStatusCode, string> = {
  IN_PROGRESS: 'กำลังดำเนินการ',
  PENDING_APPROVAL: 'รออนุมัติ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
  DRAFT: 'ร่าง',
};
import { WorkListResponse, WorkListItem } from './dto/work-list-response.dto';

/** ชื่อหมวดหมู่สำรองเมื่อ defect ไม่มีหมวดหมู่ (ไทย/อังกฤษ) */
const OTHER_CATEGORY_TH = 'หมวดหมู่อื่นๆ';
const OTHER_CATEGORY_EN = 'Other';

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
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
  ) {}

  /**
   * ดึงข้อมูล Dashboard สถิติรวมและรายการงานในเดือนที่ระบุ
   * @param dateString - วันที่ในรูปแบบ ISO string (optional, default = เดือนปัจจุบัน)
   */
  async getDashboardData(
    dateString?: string,
    branchId?: number,
  ): Promise<DashboardResponse> {
    const selectedBranchId =
      typeof branchId === 'number' && Number.isInteger(branchId) && branchId > 0
        ? branchId
        : undefined;
    const jobWhere: FindOptionsWhere<InspectionJob> | undefined =
      selectedBranchId ? { branchId: selectedBranchId } : undefined;
    const branchRows = await this.branchRepo.find({
      where: { status: 'active' },
      order: { branchName: 'ASC' },
    });
    const branches: DashboardBranchOption[] = branchRows.map((branch) => {
      const fallbackName = `Branch ${branch.branchId}`;

      return {
        id: branch.branchId,
        name: branch.branchName ?? fallbackName,
      };
    });

    // ========================================
    // 1. ดึงสถิติจำนวนงานทั้งหมด (Single Query with relations)
    // ========================================
    const allJobs: InspectionJob[] = await this.jobsRepo.find({
      where: jobWhere,
      relations: [
        'customer',
        'houseType',
        'branch',
        'rounds',
        'rounds.teamMembers',
        'rounds.teamMembers.inspector',
        'rounds.teamMembers.inspector.team',
        'rounds.teamMembers.team',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    const totalProjects: number = allJobs.length;
    let inProgress = 0;
    let singleHouse = 0;
    let townhouse = 0;
    let condo = 0;
    let construction = 0;
    const homeStatusCounts = new Map<DashboardStatusCode, number>();
    const constructionStatusCounts = new Map<DashboardStatusCode, number>();

    for (const job of allJobs) {
      // นับงานที่กำลังดำเนินการ (Active หรือ Draft)
      if (job.status === 'Active' || job.status === 'Draft') {
        inProgress++;
      }

      // จำแนกประเภทงาน (ตรวจบ้าน / ก่อสร้าง)
      const inspectionType = job.inspectionType || '';
      const isConstruction =
        inspectionType === 'CONSTRUCTION_INSPECTION' ||
        inspectionType === 'ตรวจก่อสร้าง' ||
        inspectionType === 'Construction' ||
        inspectionType === 'งานก่อสร้าง';
      if (isConstruction) {
        construction++;
      }

      // นับจำนวนงานแยกตามสถานะ สำหรับแสดงใต้ตัวเลขรวมในการ์ดสรุป
      const { statusCode } = this.mapJobStatus(job.status);
      const statusCounts = isConstruction
        ? constructionStatusCounts
        : homeStatusCounts;
      statusCounts.set(statusCode, (statusCounts.get(statusCode) ?? 0) + 1);

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

    const roundWhere: FindOptionsWhere<InspectionRound> = selectedBranchId
      ? {
          scheduledDate: Between(startOfMonth, endOfMonth),
          job: { branchId: selectedBranchId },
        }
      : {
          scheduledDate: Between(startOfMonth, endOfMonth),
        };

    const rounds: InspectionRound[] = await this.roundsRepo.find({
      where: roundWhere,
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
          ? parseInt(
              d.toLocaleDateString('en-US', {
                day: 'numeric',
                timeZone: 'Asia/Bangkok',
              }),
              10,
            )
          : 0;
      })
      .filter((day) => day > 0);

    // ========================================
    // 3. ดึง 15 งานที่ถูกสร้างล่าสุด
    // ========================================
    const recentJobs: InspectionJob[] = await this.jobsRepo.find({
      where: jobWhere,
      relations: [
        'customer',
        'houseType',
        'branch',
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
    const tasks: DashboardTaskItem[] = recentJobs.map(
      (job: InspectionJob): DashboardTaskItem => {
        // ค้นหารอบตรวจล่าสุดเพื่อดึงข้อมูล (เรียงจาก id มากไปน้อย)
        let latestRound: InspectionRound | null = null;
        if (job.rounds && job.rounds.length > 0) {
          const sortedRounds = [...job.rounds].sort(
            (a, b) => b.roundId - a.roundId,
          );
          latestRound = sortedRounds[0];
        }

        // กำหนดสถานะแสดงผลและสี (ใช้สถานะรอบตรวจ ถ้าไม่มีใช้สถานะงาน)
        const statusMapping = latestRound
          ? this.mapRoundStatus(
              latestRound.status,
              job.status,
              latestRound.roundNumber,
            )
          : this.mapJobStatus(job.status);

        const iconMapping = this.mapHouseTypeIcon(job.houseType?.name ?? '');

        // ดึงชื่อทีม
        const firstTeamMember = latestRound?.teamMembers?.[0];
        const teamName: string =
          firstTeamMember?.team?.team_name ??
          firstTeamMember?.inspector?.team?.team_name ??
          'ยังไม่ระบุทีม';

        // ดึงชื่อลูกค้า
        const customerName: string =
          job.customer?.fullName ?? 'ยังไม่ระบุลูกค้า';

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
              timeZone: 'Asia/Bangkok',
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
          referenceDate: !isNaN(referenceDate.getTime())
            ? referenceDate.toISOString()
            : null,
          status: statusMapping.displayStatus,
          statusCode: statusMapping.statusCode,
          roundNumber: latestRound?.roundNumber ?? null,
          statusBgClass: statusMapping.statusBgClass,
          statusTextColor: statusMapping.statusTextColor,
          icon: iconMapping.icon,
          avatarBgClass: iconMapping.avatarBgClass,
          avatarTextColor: iconMapping.avatarTextColor,
          day: dayOfMonth,
          team: teamName,
          customer: customerName,
          branchId: job.branchId,
          branchName: job.branch?.branchName ?? null,
        };
      },
    );

    // ========================================
    // 5. คำนวณ Monthly Trends (6 เดือนย้อนหลัง)
    // ========================================
    const monthNamesTh = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const monthlyTrends: MonthlyTrendItem[] = [];
    const now = new Date(targetDate);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNamesTh[m]} ${((y + 543) % 100)}`;

      let homeCount = 0;
      let constCount = 0;

      for (const job of allJobs) {
        const jobDate = new Date(job.createdAt);
        if (jobDate.getFullYear() === y && jobDate.getMonth() === m) {
          const inspectionType = job.inspectionType || '';
          const isConstruction =
            inspectionType === 'CONSTRUCTION_INSPECTION' ||
            inspectionType === 'ตรวจก่อสร้าง' ||
            inspectionType === 'Construction' ||
            inspectionType === 'งานก่อสร้าง';
          if (isConstruction) {
            constCount++;
          } else {
            homeCount++;
          }
        }
      }

      monthlyTrends.push({
        monthKey,
        monthLabel,
        homeInspection: homeCount,
        construction: constCount,
        total: homeCount + constCount,
      });
    }

    // ========================================
    // 6. ดึงข้อมูล Defects ทั้งหมดสำหรับ Drilldown
    // ========================================
    const defects = await this.defectsRepo.find({
      relations: [
        'round',
        'round.job',
        'subCategories',
        'subCategories.category',
        'updatedBy',
      ],
    });

    let totalDefects = 0;
    let totalVerified = 0;
    let globalPending = 0;
    let globalRepaired = 0;
    const globalCategories = new Map<string, number>();
    // ชื่อหมวดหมู่ภาษาอังกฤษ (key = ชื่อไทยที่ใช้รวมสถิติ) ให้ frontend เลือกแสดงตามภาษา
    const categoryNamesEn = new Map<string, string | null>([
      [OTHER_CATEGORY_TH, OTHER_CATEGORY_EN],
    ]);
    const registerCategoryName = (sub: {
      name?: string | null;
      nameEn?: string | null;
      category?: { name?: string | null; nameEn?: string | null } | null;
    }): string => {
      const name = sub.category?.name || sub.name || OTHER_CATEGORY_TH;
      if (!categoryNamesEn.has(name)) {
        categoryNamesEn.set(
          name,
          sub.category?.name ? sub.category.nameEn || null : sub.nameEn || null,
        );
      }
      return name;
    };

    const jobDefectMap = new Map<
      number,
      {
        categories: Map<string, number>;
        pending: number;
        repaired: number;
        verified: number;
        contractorName: string | null;
      }
    >();

    const categoryColors = [
      '#3B82F6', // Blue
      '#F97316', // Orange
      '#10B981', // Emerald
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#EAB308', // Yellow
      '#06B6D4', // Cyan
      '#64748B', // Slate
    ];

    for (const defect of defects) {
      const defectBranchId = defect.round?.job?.branchId;
      // กรองตามสาขาเฉพาะเมื่อผู้ใช้เลือกสาขาเฉพาะ และงานของ defect มี branchId ระบุ
      if (selectedBranchId && defectBranchId && defectBranchId !== selectedBranchId) {
        continue;
      }

      totalDefects++;
      const statusLower = (defect.status || '').toLowerCase();
      if (statusLower === 'verified') {
        totalVerified++;
      } else if (statusLower === 'repaired') {
        globalRepaired++;
      } else {
        globalPending++;
      }

      // นับรายโครงการ (ถ้ามี jobId)
      const jobId = defect.round?.job?.jobId;
      if (jobId) {
        if (!jobDefectMap.has(jobId)) {
          jobDefectMap.set(jobId, {
            categories: new Map<string, number>(),
            pending: 0,
            repaired: 0,
            verified: 0,
            contractorName:
              defect.updatedBy?.companyName ?? defect.updatedBy?.fullName ?? null,
          });
        }

        const entry = jobDefectMap.get(jobId)!;
        if (statusLower === 'verified') {
          entry.verified++;
        } else if (statusLower === 'repaired') {
          entry.repaired++;
        } else {
          entry.pending++;
        }

        if (defect.subCategories && defect.subCategories.length > 0) {
          for (const sub of defect.subCategories) {
            const catName = registerCategoryName(sub);
            entry.categories.set(
              catName,
              (entry.categories.get(catName) || 0) + 1,
            );
          }
        } else {
          entry.categories.set(
            OTHER_CATEGORY_TH,
            (entry.categories.get(OTHER_CATEGORY_TH) || 0) + 1,
          );
        }
      }

      // รวมสถิติหมวดหมู่ Defect ระดับทั้งระบบ
      if (defect.subCategories && defect.subCategories.length > 0) {
        for (const sub of defect.subCategories) {
          const catName = registerCategoryName(sub);
          globalCategories.set(
            catName,
            (globalCategories.get(catName) || 0) + 1,
          );
        }
      } else {
        globalCategories.set(
          OTHER_CATEGORY_TH,
          (globalCategories.get(OTHER_CATEGORY_TH) || 0) + 1,
        );
      }
    }

    const overallCompletionRate =
      totalDefects > 0 ? Math.round((totalVerified / totalDefects) * 100) : 0;

    const sortedGlobalCategories = Array.from(globalCategories.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    let totalCatPoints = 0;
    for (const [, count] of sortedGlobalCategories) {
      totalCatPoints += count;
    }

    const top5 = sortedGlobalCategories.slice(0, 5);
    const rest = sortedGlobalCategories.slice(5);
    const restCount = rest.reduce((sum, [, count]) => sum + count, 0);

    const topDefectCategories: JobDefectCategoryItem[] = top5.map(
      ([catName, count], idx) => ({
        categoryId: idx + 1,
        categoryName: catName,
        categoryNameEn: categoryNamesEn.get(catName) ?? null,
        count,
        percentage:
          totalCatPoints > 0 ? Math.round((count / totalCatPoints) * 100) : 0,
        color: categoryColors[idx % categoryColors.length],
      }),
    );

    if (restCount > 0) {
      topDefectCategories.push({
        categoryId: 6,
        categoryName: OTHER_CATEGORY_TH,
        categoryNameEn: OTHER_CATEGORY_EN,
        count: restCount,
        percentage:
          totalCatPoints > 0
            ? Math.round((restCount / totalCatPoints) * 100)
            : 0,
        color: '#94A3B8',
      });
    }

    const overallDefectResolution: JobDefectResolution = {
      pending: globalPending,
      repaired: globalRepaired,
      verified: totalVerified,
      total: totalDefects,
      completionRate: overallCompletionRate,
    };

    const jobDrilldowns: JobDrilldownItem[] = recentJobs.map((job) => {
      const entry = jobDefectMap.get(job.jobId);
      const pending = entry?.pending || 0;
      const repaired = entry?.repaired || 0;
      const verified = entry?.verified || 0;
      const total = pending + repaired + verified;
      const completionRate =
        total > 0 ? Math.round((verified / total) * 100) : 0;

      const defectCategories: JobDefectCategoryItem[] = [];
      if (entry && entry.categories.size > 0) {
        let colorIdx = 0;
        let sumCat = 0;
        for (const count of entry.categories.values()) sumCat += count;

        entry.categories.forEach((count, catName) => {
          defectCategories.push({
            categoryId: colorIdx + 1,
            categoryName: catName,
            categoryNameEn: categoryNamesEn.get(catName) ?? null,
            count,
            percentage: sumCat > 0 ? Math.round((count / sumCat) * 100) : 0,
            color: categoryColors[colorIdx % categoryColors.length],
          });
          colorIdx++;
        });
      }

      const { statusCode } = this.mapJobStatus(job.status);

      return {
        jobId: job.jobId,
        title: job.projectName ?? 'ไม่ระบุโครงการ',
        customerName: job.customer?.fullName ?? 'ลูกค้าทั่วไป',
        inspectionType: job.inspectionType ?? 'ตรวจบ้าน',
        status: job.status,
        statusCode,
        contractorName: entry?.contractorName ?? null,
        defectCategories,
        resolution: {
          pending,
          repaired,
          verified,
          total,
          completionRate,
        },
      };
    });

    // ========================================
    // 7. คำนวณ Team Workload และ Property Types
    // ========================================
    const teamWhere: FindOptionsWhere<Team> = { status: 'active' };
    if (selectedBranchId) {
      teamWhere.branchId = selectedBranchId;
    }
    const allActiveTeams: Team[] = await this.teamsRepo.find({
      where: teamWhere,
      order: { team_name: 'ASC' },
    });

    const teamMap = new Map<
      number,
      { teamName: string; active: number; completed: number; total: number }
    >();

    // ตั้งต้นรายการทีมทั้งหมดจากฐานข้อมูล
    for (const team of allActiveTeams) {
      teamMap.set(team.team_Id, {
        teamName: team.team_name,
        active: 0,
        completed: 0,
        total: 0,
      });
    }

    for (const job of allJobs) {
      const rounds = job.rounds || [];
      let foundTeamId: number | undefined;
      let foundTeamName = 'ทีมส่วนกลาง';

      for (const round of rounds) {
        const members = round.teamMembers || [];
        for (const member of members) {
          const tId = member.team?.team_Id ?? member.inspector?.team?.team_Id;
          const tName = member.team?.team_name ?? member.inspector?.team?.team_name;
          if (tId) {
            foundTeamId = tId;
            foundTeamName = tName || 'ทีมส่วนกลาง';
            break;
          }
        }
        if (foundTeamId) break;
      }

      if (foundTeamId) {
        if (!teamMap.has(foundTeamId)) {
          teamMap.set(foundTeamId, {
            teamName: foundTeamName,
            active: 0,
            completed: 0,
            total: 0,
          });
        }
        const t = teamMap.get(foundTeamId)!;
        t.total++;
        if (job.status === 'Completed') {
          t.completed++;
        } else {
          t.active++;
        }
      }
    }

    const teamWorkloads: TeamWorkloadItem[] = Array.from(
      teamMap.entries(),
    ).map(([teamId, data]) => ({
      teamId,
      teamName: data.teamName,
      activeCount: data.active,
      completedCount: data.completed,
      totalCount: data.total,
    }));

    const totalTypes = totalProjects || 1;
    const propertyTypes: PropertyTypeItem[] = [
      {
        name: 'บ้านเดี่ยว',
        count: singleHouse,
        percentage: Math.round((singleHouse / totalTypes) * 100),
        color: '#3B82F6',
      },
      {
        name: 'ทาวน์โฮม',
        count: townhouse,
        percentage: Math.round((townhouse / totalTypes) * 100),
        color: '#10B981',
      },
      {
        name: 'คอนโดมิเนียม',
        count: condo,
        percentage: Math.round((condo / totalTypes) * 100),
        color: '#F97316',
      },
      {
        name: 'งานก่อสร้าง/อื่นๆ',
        count: construction,
        percentage: Math.round((construction / totalTypes) * 100),
        color: '#8B5CF6',
      },
    ];

    return {
      totalProjects,
      inProgress,
      singleHouse,
      townhouse,
      condo,
      construction,
      totalDefects,
      overallCompletionRate,
      homeStatusBreakdown: this.toStatusBreakdown(homeStatusCounts),
      constructionStatusBreakdown: this.toStatusBreakdown(
        constructionStatusCounts,
      ),
      branches,
      calendarEvents,
      tasks,
      monthlyTrends,
      jobDrilldowns,
      teamWorkloads,
      propertyTypes,
      topDefectCategories,
      overallDefectResolution,
    };
  }

  /**
   * แปลง Map<สถานะ, จำนวน> เป็น array ที่เรียงลำดับตาม STATUS_DISPLAY_ORDER
   * เพื่อให้ Frontend แสดงผลได้ตามลำดับที่คาดเดาได้
   */
  private toStatusBreakdown(
    counts: Map<DashboardStatusCode, number>,
  ): DashboardStatusCount[] {
    return STATUS_DISPLAY_ORDER.filter((code) => counts.has(code)).map(
      (code) => ({
        status: STATUS_LABEL_TH[code],
        statusCode: code,
        count: counts.get(code) ?? 0,
      }),
    );
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
        let displayStatus = 'ร่าง';
        let statusBgClass = 'bg-grey-2';
        let statusTextColor = 'grey-8';
        let statusKey = 'waiting';

        if (latestRound) {
          if (
            latestRound.status === 'COMPLETED' ||
            latestRound.status === 'APPROVED'
          ) {
            // งานถูกปิดตอนแอดมินอนุมัติรอบที่ defect ผ่านครบ (ดู InspectionRoundsService.approveReport)
            if (job.status === 'Completed') {
              displayStatus = `เสร็จสิ้น ${latestRound.roundNumber}`;
              statusBgClass = 'bg-green-1';
              statusTextColor = 'positive';
              statusKey = 'others';
            } else {
              displayStatus = 'กำลังดำเนินการ';
              statusBgClass = 'bg-blue-1';
              statusTextColor = 'primary';
              statusKey = 'in_progress';
            }
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
  private mapRoundStatus(
    status: string,
    jobStatus: string,
    roundNumber?: number,
  ): {
    displayStatus: string;
    statusCode: DashboardStatusCode;
    statusBgClass: string;
    statusTextColor: string;
  } {
    if (status === 'COMPLETED' || status === 'APPROVED') {
      if (jobStatus !== 'Completed') {
        return {
          displayStatus: STATUS_LABEL_TH.IN_PROGRESS,
          statusCode: 'IN_PROGRESS',
          statusBgClass: 'bg-blue-1',
          statusTextColor: 'primary',
        };
      }
      return {
        displayStatus: roundNumber
          ? `${STATUS_LABEL_TH.COMPLETED} ${roundNumber}`
          : STATUS_LABEL_TH.COMPLETED,
        statusCode: 'COMPLETED',
        statusBgClass: 'bg-green-1',
        statusTextColor: 'positive',
      };
    } else if (status === 'SUBMITTED') {
      return {
        displayStatus: STATUS_LABEL_TH.PENDING_APPROVAL,
        statusCode: 'PENDING_APPROVAL',
        statusBgClass: 'bg-orange-1',
        statusTextColor: 'orange-8',
      };
    } else {
      return {
        displayStatus: STATUS_LABEL_TH.IN_PROGRESS,
        statusCode: 'IN_PROGRESS',
        statusBgClass: 'bg-blue-1',
        statusTextColor: 'primary',
      };
    }
  }

  /**
   * Map สถานะของ InspectionJob → สีและข้อความที่ Frontend ต้องใช้ (กรณีที่ยังไม่มีรอบนัดหมาย)
   */
  private mapJobStatus(status: string): {
    displayStatus: string;
    statusCode: DashboardStatusCode;
    statusBgClass: string;
    statusTextColor: string;
  } {
    if (status === 'Active') {
      return {
        displayStatus: STATUS_LABEL_TH.IN_PROGRESS,
        statusCode: 'IN_PROGRESS',
        statusBgClass: 'bg-blue-1',
        statusTextColor: 'primary',
      };
    } else if (status === 'Completed') {
      return {
        displayStatus: STATUS_LABEL_TH.COMPLETED,
        statusCode: 'COMPLETED',
        statusBgClass: 'bg-green-1',
        statusTextColor: 'positive',
      };
    } else if (status === 'Cancelled') {
      return {
        displayStatus: STATUS_LABEL_TH.CANCELLED,
        statusCode: 'CANCELLED',
        statusBgClass: 'bg-red-1',
        statusTextColor: 'negative',
      };
    } else if (status === 'Pending') {
      return {
        displayStatus: STATUS_LABEL_TH.PENDING_APPROVAL,
        statusCode: 'PENDING_APPROVAL',
        statusBgClass: 'bg-orange-1',
        statusTextColor: 'orange-8',
      };
    } else {
      return {
        displayStatus: STATUS_LABEL_TH.DRAFT,
        statusCode: 'DRAFT',
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

  /**
   * Sync existing jobs with their latest rounds to fix DB inconsistencies
   */
  async syncJobStatuses(): Promise<{ synced: number }> {
    const jobs = await this.jobsRepo.find({ relations: ['rounds'] });
    let count = 0;

    for (const job of jobs) {
      if (!job.rounds || job.rounds.length === 0) continue;

      const sortedRounds = [...job.rounds].sort(
        (a, b) => b.roundId - a.roundId,
      );
      const latestRound = sortedRounds[0];

      let newStatus = job.status;
      if (
        latestRound.status === 'APPROVED' ||
        latestRound.status === 'COMPLETED'
      ) {
        // ไม่คำนวณ "ปิดงาน" ใหม่ที่นี่ — ตัดสินครั้งเดียวตอนอนุมัติ (approveReport) แล้วเก็บไว้ใน job.status
        newStatus = job.status === 'Completed' ? 'Completed' : 'Active';
      } else if (latestRound.status === 'SUBMITTED') {
        newStatus = 'Pending';
      } else if (
        latestRound.status === 'Active' ||
        latestRound.status === 'SCHEDULED' ||
        latestRound.status === 'DRAFT'
      ) {
        newStatus = 'Active';
      }

      // งานที่ปิดไปก่อนมีคอลัมน์ completedAt — ใช้เวลาอนุมัติรอบล่าสุดแทน
      const newCompletedAt =
        newStatus === 'Completed'
          ? (job.completedAt ?? latestRound.approvedAt ?? null)
          : null;

      if (
        job.status !== newStatus ||
        job.completedAt?.getTime() !== newCompletedAt?.getTime()
      ) {
        job.status = newStatus;
        job.completedAt = newCompletedAt;
        await this.jobsRepo.save(job);
        count++;
      }
    }

    return { synced: count };
  }
}
