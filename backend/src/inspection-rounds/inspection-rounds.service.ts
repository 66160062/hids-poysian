import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Repository, DataSource, Not } from 'typeorm';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { Defect, DefectStatus } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActivityLogType } from 'src/activity-logs/entities/activity-log.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { AuthService } from 'src/auth/auth.service';
import { ContractorService } from 'src/contractor/contractor.service';
import { StorageService } from 'src/storage/storage.service';
import { ReportsService, ReportLocale } from 'src/reports/reports.service';
import { UpdateJobInfoDto } from './dto/update-job-info.dto';
@Injectable()
export class InspectionRoundsService {
  private readonly logger = new Logger(InspectionRoundsService.name);

  constructor(
    @InjectRepository(InspectionRound)
    private readonly inspectionRoundsRepo: Repository<InspectionRound>,
    @InjectRepository(InspectionJob)
    private readonly inspectionJobsRepo: Repository<InspectionJob>,
    @InjectRepository(InspectionTeamMember)
    private readonly teamMembersRepo: Repository<InspectionTeamMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
    private readonly dataSource: DataSource,
    private readonly activityLogsService: ActivityLogsService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    private readonly contractorService: ContractorService,
    private readonly storageService: StorageService,
    private readonly reportsService: ReportsService,
  ) {}

  private isConstructionJob(job?: InspectionJob | null): boolean {
    return (
      job?.inspectionType === 'CONSTRUCTION_INSPECTION' ||
      job?.inspectionType === 'Construction' ||
      job?.inspectionType === 'ตรวจก่อสร้าง'
    );
  }

  // defect ที่ยังไม่ผ่านการตรวจ (รอซ่อม/ซ่อมแล้วแต่ยังไม่ verify/ถูกตีกลับ) ในรอบนี้
  private countOpenDefects(roundId: number): Promise<number> {
    return this.defectsRepo.count({
      where: { round: { roundId }, status: Not(DefectStatus.VERIFIED) },
    });
  }

  private formatThaiDate(date: Date): string {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  async create(
    createInspectionRoundDto: CreateInspectionRoundDto,
  ): Promise<InspectionRound> {
    if (createInspectionRoundDto.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(createInspectionRoundDto.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        throw new BadRequestException('ไม่สามารถเลือกวันนัดหมายย้อนหลังได้');
      }
    }

    const job = await this.inspectionJobsRepo.findOneByOrFail({
      jobId: createInspectionRoundDto.jobId,
    });

    if (job.status === 'Completed') {
      throw new BadRequestException(
        'ไม่สามารถสร้างรอบใหม่ได้ เนื่องจากงานนี้ปิดงานแล้ว',
      );
    }

    const latestRound = await this.inspectionRoundsRepo.findOne({
      where: { job: { jobId: job.jobId } },
      order: { roundNumber: 'DESC' },
    });

    if (
      latestRound &&
      latestRound.status !== 'APPROVED' &&
      latestRound.status !== 'CANCELLED'
    ) {
      throw new BadRequestException(
        'ไม่สามารถสร้างรอบใหม่ได้ เนื่องจากรอบก่อนหน้ายังไม่เสร็จสิ้น',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const round = queryRunner.manager.create(InspectionRound, {
        ...createInspectionRoundDto,
        job,
      });

      const savedRound = await queryRunner.manager.save(round);

      job.status = 'Active';
      await queryRunner.manager.save(job);

      if (createInspectionRoundDto.teamMemberId) {
        const teamMember = await queryRunner.manager.findOneByOrFail(
          InspectionTeamMember,
          {
            id: createInspectionRoundDto.teamMemberId,
          },
        );
        teamMember.round = savedRound;
        await queryRunner.manager.save(teamMember);
      }

      if (latestRound) {
        // Copy summaryCompletedAt from the previous round so UI recognizes summary as completed
        savedRound.summaryCompletedAt = latestRound.summaryCompletedAt;
        await queryRunner.manager.save(savedRound);

        const latestItems = await queryRunner.manager.find(
          InspectionSummaryItem,
          {
            where: { round: { roundId: latestRound.roundId } },
            relations: ['template', 'option', 'refItem'],
          },
        );

        if (latestItems.length > 0) {
          const clonedItems = latestItems.map((item) =>
            queryRunner.manager.create(InspectionSummaryItem, {
              round: savedRound,
              template: item.template,
              option: item.option,
              refItem: item.refItem,
              detailValue: item.detailValue,
              photoUrl: item.photoUrl,
            }),
          );
          await queryRunner.manager.save(clonedItems);
        }

        const latestDefects = await queryRunner.manager.find(Defect, {
          where: {
            round: { roundId: latestRound.roundId },
            status: Not(DefectStatus.VERIFIED),
          },
          relations: [
            'room',
            'subRoom',
            'floor',
            'subCategories',
            'inspector',
            'plan',
          ],
        });

        if (latestDefects.length > 0) {
          const clonedDefects = latestDefects.map((defect) =>
            queryRunner.manager.create(Defect, {
              ...defect,
              defectId: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              round: savedRound,
            }),
          );
          await queryRunner.manager.save(clonedDefects);
        }
      }

      await queryRunner.commitTransaction();

      void this.activityLogsService.log(
        job.jobId,
        {
          type: ActivityLogType.ROUND_SCHEDULED,
          color: 'blue',
          title: `นัดหมายตรวจรอบที่ ${savedRound.roundNumber}`,
          sub: savedRound.scheduledDate
            ? `วันที่ตรวจ: ${this.formatThaiDate(new Date(savedRound.scheduledDate))}`
            : undefined,
        },
        savedRound.roundId,
      );

      return savedRound;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async backfillSummaries() {
    const rounds = await this.inspectionRoundsRepo.find({
      relations: ['job'],
    });

    let backfilledCount = 0;

    for (const round of rounds) {
      if (round.roundNumber > 1) {
        const existingItems = await this.dataSource.manager.find(
          InspectionSummaryItem,
          {
            where: { round: { roundId: round.roundId } },
          },
        );

        if (existingItems.length === 0) {
          const previousRound = await this.inspectionRoundsRepo.findOne({
            where: {
              job: { jobId: round.job.jobId },
              roundNumber: round.roundNumber - 1,
            },
          });

          if (previousRound) {
            const previousItems = await this.dataSource.manager.find(
              InspectionSummaryItem,
              {
                where: { round: { roundId: previousRound.roundId } },
                relations: ['template', 'option', 'refItem'],
              },
            );

            if (previousItems.length > 0) {
              const clonedItems = previousItems.map((item) =>
                this.dataSource.manager.create(InspectionSummaryItem, {
                  round: round,
                  template: item.template,
                  option: item.option,
                  refItem: item.refItem,
                  detailValue: item.detailValue,
                  photoUrl: item.photoUrl,
                }),
              );
              await this.dataSource.manager.save(clonedItems);
              backfilledCount++;
            }
          }
        }
      }
    }
    return backfilledCount;
  }

  findAll() {
    return this.inspectionRoundsRepo.find();
  }

  findOne(id: number) {
    return this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: [
        'job',
        'job.address',
        'job.customer',
        'job.houseType',
        'job.branch',
        'job.contractor',
        'job.housePlans',
        'job.housePlans.floor',
        'job.createdBy',
        'teamMembers',
        'teamMembers.inspector',
        'teamMembers.inspector.team',
        'teamMembers.team',
      ],
    });
  }

  // อัปเดต "ข้อมูลผู้รับเหมา + รูปหน้าโครงการ" ของ job ที่รอบตรวจนี้สังกัดอยู่ —
  // ขอบเขตจำกัดเฉพาะ 2 อย่างนี้เท่านั้น (ตั้งใจไม่ใช้ endpoint แก้ไข job แบบเต็มของ admin เพื่อไม่ให้
  // inspector แก้ field อื่น เช่น ชื่อโครงการ/ลูกค้า/สถานะงาน ได้) — คนเรียกถูกเช็คสิทธิ์มาแล้วที่
  // RoundAccessGuard (admin หรือ inspector ที่ถูก assign เข้ารอบนี้)
  async updateJobInfo(
    roundId: number,
    dto: UpdateJobInfoDto,
    files: {
      projectImageUrl?: Express.Multer.File[];
    },
  ): Promise<InspectionJob> {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId },
      relations: ['job', 'job.contractor'],
    });
    const job = round.job;

    // สร้าง/แก้ไขผู้รับเหมา เฉพาะตอนกรอกชื่อ+เบอร์โทรมาครบ (ทั้งคู่บังคับตาม Contractor entity)
    if (dto.contractorFullName && dto.contractorPhoneNumber) {
      const contractorPayload = {
        fullName: dto.contractorFullName,
        phoneNumber: dto.contractorPhoneNumber,
        email: dto.contractorEmail,
        companyName: dto.contractorCompanyName,
      };
      if (job.contractor) {
        await this.contractorService.update(
          job.contractor.contractorId,
          contractorPayload,
        );
      } else {
        job.contractor = await this.contractorService.create(contractorPayload);
      }
    }

    const projectImage = files?.projectImageUrl?.[0];
    if (projectImage) {
      job.projectImageUrl = await this.storageService.uploadImage(
        projectImage.buffer,
        'inspection_jobs',
      );
    }

    await this.inspectionJobsRepo.save(job);

    return this.inspectionJobsRepo.findOneOrFail({
      where: { jobId: job.jobId },
      relations: ['contractor'],
    });
  }

  async findByWeek(inspectorId: number, dateString?: string) {
    const baseDate = this.parseDateInput(dateString);
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.findRoundsForInspector(inspectorId, startOfWeek, endOfWeek);
  }

  async findByMonth(inspectorId: number, dateString?: string) {
    const targetDate = this.parseDateInput(dateString);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.findRoundsForInspector(inspectorId, startOfMonth, endOfMonth);
  }

  private parseDateInput(dateString?: string): Date {
    if (!dateString) return new Date();

    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return new Date(dateString);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  private async findRoundsForInspector(
    inspectorId: number,
    start: Date,
    end: Date,
  ): Promise<InspectionRound[]> {
    const inspector = await this.usersRepo.findOne({
      where: { id: inspectorId },
      relations: ['team'],
    });
    const teamId = inspector?.team?.team_Id || null;

    return this.inspectionRoundsRepo
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.job', 'job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.address', 'address')
      .leftJoinAndSelect('job.houseType', 'houseType')
      .leftJoinAndSelect('job.branch', 'branch')
      .leftJoin('round.teamMembers', 'teamMembers')
      .leftJoin('teamMembers.inspector', 'roundInspector')
      .leftJoin('teamMembers.team', 'roundTeam')
      .leftJoin(
        Assignment,
        'directAssignment',
        '"directAssignment"."round_id" = "round"."round_id" AND "directAssignment"."inspector_id" = :inspectorId AND "directAssignment"."deleted_at" IS NULL',
        { inspectorId },
      )
      .leftJoin(
        Assignment,
        'jobAssignment',
        '"jobAssignment"."job_id" = "job"."job_id" AND "jobAssignment"."inspector_id" = :inspectorId AND "jobAssignment"."round_id" IS NULL AND "jobAssignment"."deleted_at" IS NULL',
        { inspectorId },
      )
      .where('round.scheduledDate BETWEEN :start AND :end', { start, end })
      .andWhere(
        `(roundInspector.id = :inspectorId
          OR (roundTeam.team_Id = :teamId AND :teamId IS NOT NULL)
          OR "directAssignment"."id" IS NOT NULL
          OR "jobAssignment"."id" IS NOT NULL)`,
        { inspectorId, teamId },
      )
      .andWhere('round.deleted_at IS NULL')
      .orderBy('round.scheduledDate', 'ASC')
      .getMany();
  }

  async update(id: number, updateInspectionRoundDto: UpdateInspectionRoundDto) {
    if (updateInspectionRoundDto.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(updateInspectionRoundDto.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        throw new BadRequestException('ไม่สามารถเลือกวันนัดหมายย้อนหลังได้');
      }
    }

    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    Object.assign(round, updateInspectionRoundDto);
    return this.inspectionRoundsRepo.save(round);
  }

  async remove(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    return this.inspectionRoundsRepo.softRemove(round);
  }

  async confirmInspection(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });

    // เรียกซ้ำได้ตอนแก้ไขรอบที่ตรวจไปแล้ว (ดูปุ่ม "บันทึกการแก้ไขการตรวจ" ฝั่ง frontend)
    // แต่ห้ามหลังอนุมัติ ไม่งั้นจะ regenerate PDF/AI summary ทับรายงานที่ส่งลูกค้าไปแล้ว
    if (round.status === 'APPROVED') {
      throw new BadRequestException('ไม่สามารถแก้ไขรอบตรวจที่อนุมัติแล้วได้');
    }

    round.inspectedAt = new Date();
    const saved = await this.inspectionRoundsRepo.save(round);

    void this.activityLogsService.logForRound(id, {
      type: ActivityLogType.ROUND_INSPECTED,
      color: 'blue',
      title: `วิศวกรเข้าตรวจรอบที่ ${saved.roundNumber} เสร็จสิ้น`,
    });

    return saved;
  }

  async confirmSummary(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });

    if (round.status === 'APPROVED') {
      throw new BadRequestException('ไม่สามารถแก้ไขรอบตรวจที่อนุมัติแล้วได้');
    }

    round.summaryCompletedAt = new Date();
    return this.inspectionRoundsRepo.save(round);
  }

  async submit(id: number): Promise<InspectionRound> {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: ['job'],
    });

    const isConstruction = this.isConstructionJob(round.job);

    if (!round.inspectedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันผลการตรวจ',
      );
    }

    if (!isConstruction && !round.summaryCompletedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันการสรุปรายงาน',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      round.status = 'SUBMITTED';
      round.submittedAt = new Date();

      if (round.job) {
        round.job.status = 'Pending';
        await queryRunner.manager.save(round.job);
      }

      const savedRound = await queryRunner.manager.save(round);
      await queryRunner.commitTransaction();

      if (savedRound.job) {
        const defectCount = await this.defectsRepo.count({
          where: { round: { roundId: id } },
        });
        void this.activityLogsService.log(
          savedRound.job.jobId,
          {
            type: ActivityLogType.ROUND_SUBMITTED,
            color: 'orange',
            title: `ส่งรายงานรอบที่ ${savedRound.roundNumber} ให้ลูกค้าตรวจสอบแล้ว`,
            sub: `${defectCount} รายการ`,
          },
          savedRound.roundId,
        );

        void this.notificationsService.create({
          type: NotificationType.ALERT,
          recipientRole: 'admin',
          message: `${savedRound.job.projectName}: ตรวจงวดที่ ${savedRound.roundNumber} รออนุมัติ`,
          jobId: savedRound.job.jobId,
          roundId: savedRound.roundId,
        });
      }

      return savedRound;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveReport(
    id: number,
  ): Promise<{ data: InspectionRound; notification: any }> {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: [
        'job',
        'job.customer',
        'teamMembers',
        'teamMembers.inspector',
      ],
    });

    if (round.status !== 'SUBMITTED') {
      throw new BadRequestException('Report must be submitted before approval');
    }

    // งานตรวจบ้าน: ปิดงานได้เมื่อ defect ทุกรายการในรอบนี้ตรวจผ่านแล้ว (ไม่ดูเลขรอบ)
    // งานก่อสร้างยังไม่มีเกณฑ์ปิดงานจาก defect จึงคงกฎเดิม (รอบที่ 2 ขึ้นไป)
    const shouldCloseJob = this.isConstructionJob(round.job)
      ? round.roundNumber >= 2
      : (await this.countOpenDefects(round.roundId)) === 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      round.status = 'APPROVED';
      round.approvedAt = new Date();

      if (round.job) {
        round.job.status = shouldCloseJob ? 'Completed' : 'Active';
        round.job.completedAt = shouldCloseJob ? round.approvedAt : null;
        await queryRunner.manager.save(round.job);
      }

      const approvedRound = await queryRunner.manager.save(round);
      await queryRunner.commitTransaction();

      if (approvedRound.job) {
        void this.activityLogsService.log(
          approvedRound.job.jobId,
          {
            type: ActivityLogType.ROUND_APPROVED,
            color: 'green',
            title: `ลูกค้าอนุมัติรายงานรอบที่ ${approvedRound.roundNumber} แล้ว`,
            sub: shouldCloseJob ? 'ปิดงานเรียบร้อย' : undefined,
          },
          approvedRound.roundId,
        );
      }

      const notification = this.buildApprovalNotification(approvedRound);

      // ===== ส่ง Email แจ้งลูกค้าอัตโนมัติ (fire-and-forget) =====
      void this.sendApprovalEmailToCustomer(approvedRound);

      return {
        data: approvedRound,
        notification,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ส่ง Email แจ้งผลอนุมัติให้ลูกค้า — สร้าง Token Link + PDF แล้วส่ง
   * เป็น fire-and-forget: ถ้า fail จะแค่ log error ไม่กระทบ flow หลัก
   */
  private async sendApprovalEmailToCustomer(
    round: InspectionRound,
  ): Promise<void> {
    try {
      const customerEmail = round.job?.customer?.email;
      const customerName = round.job?.customer?.fullName;
      const projectName = round.job?.projectName;
      const jobId = round.job?.jobId;

      if (!customerEmail || !jobId) {
        this.logger.warn(
          `ข้ามการส่ง email: ไม่พบอีเมลลูกค้าหรือ jobId สำหรับ round ${round.roundId}`,
        );
        return;
      }

      // 1. สร้าง Customer Token Link
      const tokenResult = await this.authService.generateLinkToken(
        jobId,
        'customer',
      );

      // 2. แนบ PDF ไฟล์เดียวกับที่เปิดดูในแอป (render ทันที ไม่รอ debounce)
      // ภาษาตาม customer.preferredLocale ที่แอดมินตั้งไว้ — ไม่มี "locale ปัจจุบัน" ให้อ้างอิงเพราะ flow นี้ทำงานฝั่ง server ล้วน
      const customerLocale: ReportLocale =
        round.job?.customer?.preferredLocale === 'en-US' ? 'en-US' : 'th-TH';
      const pdfBuffer = await this.reportsService.getLatestReportPdf(
        round.roundId,
        customerLocale,
      );

      // 3. ส่ง Email
      await this.mailService.sendApprovalEmail({
        customerName: customerName ?? 'ลูกค้า',
        customerEmail,
        projectName: projectName ?? 'โครงการ',
        roundNumber: round.roundNumber,
        tokenUrl: tokenResult.url,
        pdfBuffer,
      });
    } catch (error) {
      this.logger.error(
        `❌ ส่ง email แจ้งลูกค้าไม่สำเร็จ (round ${round.roundId}): ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private buildApprovalNotification(round: InspectionRound) {
    const primaryInspectorId = round.teamMembers?.[0]?.inspector?.id ?? null;
    return {
      type: 'REPORT_APPROVED',
      recipientUserId: primaryInspectorId,
      title: 'Report approved',
      message: `Inspection report #${round.roundId} has been approved.`,
      payload: {
        roundId: round.roundId,
        jobId: round.job?.jobId ?? null,
        status: round.status,
        approvedAt: round.approvedAt,
      },
    };
  }
}
