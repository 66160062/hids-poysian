import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Defect } from './entities/defect.entity';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { ContractorUpdateDefectDto } from './dto/contractor-update-defect.dto';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { DefectStatus } from './entities/defect.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';
import { InspectionJobStatus } from 'src/inspection-jobs/enums/inspection-job-status.enum';
import {
  ActivityLogsService,
  LogEntryInput,
} from 'src/activity-logs/activity-logs.service';
import { ActivityLogType } from 'src/activity-logs/entities/activity-log.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';

type LinkTokenPayload = {
  project_id: number;
  role: string;
};

// รอบตรวจที่ยื่นอนุมัติ (หรืออนุมัติแล้ว) ห้ามแก้ไข/ลบ defect — ต้องตรงกับ LOCKED_STATUSES ฝั่ง frontend (useRoundLock.ts)
const LOCKED_ROUND_STATUSES = ['SUBMITTED', 'APPROVED'];

// สัดส่วนซ่อมเสร็จที่ยิงแจ้งเตือนแอดมิน (ยิงครั้งเดียวต่อรอบ กันสแปม — ดู repairAlertSentAt บน InspectionRound)
const REPAIR_ALERT_THRESHOLD = 0.8;

@Injectable()
export class DefectsService {
  private readonly logger = new Logger(DefectsService.name);

  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,

    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,

    @InjectRepository(DefectSubCategory)
    private readonly subCategoriesRepo: Repository<DefectSubCategory>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,

    @InjectRepository(SubRoom)
    private readonly subRoomsRepo: Repository<SubRoom>,

    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ประกอบข้อความ "ห้องนั่งเล่น • ห้องนอนชั้น2" จาก room/subRoom ของ defect ที่ผ่านการ save แล้ว
  private buildLocationSub(defect: Defect): string | undefined {
    const parts = [defect.room?.roomName, defect.subRoom?.roomName].filter(
      (part): part is string => !!part,
    );
    return parts.length ? parts.join(' • ') : undefined;
  }

  private logDefectActivity(defect: Defect, entry: LogEntryInput) {
    const roundId = defect.round?.roundId;
    if (!roundId) return;
    void this.activityLogsService.logForRound(roundId, entry);
  }

  // เช็คซ้ำแบบเดียวกับฝั่ง frontend (isDuplicateDefect ใน AddDefectPage.vue) แต่ query จาก DB สด
  // กันเคส 2 inspector คนละ session บันทึกจุดเดียวกันพร้อมกัน ซึ่ง local store ฝั่ง frontend มองไม่เห็นกัน
  private async hasDuplicateDefect(
    dto: CreateDefectDto,
  ): Promise<boolean> {
    const candidates = await this.defectsRepo.find({
      where: {
        round: { roundId: dto.roundId },
        room: { roomId: dto.roomId },
        subRoom: dto.subRoomId ? { subRoomId: dto.subRoomId } : IsNull(),
        floor: { floorId: dto.floorId },
        severity: dto.severity,
        description: dto.description ?? '-',
      },
      relations: ['subCategories'],
    });

    const wantedIds = [...dto.subCategoryIds].sort((a, b) => a - b);
    return candidates.some((candidate) => {
      const ids = candidate.subCategories
        .map((s) => s.subCategoryId)
        .sort((a, b) => a - b);
      return (
        ids.length === wantedIds.length &&
        ids.every((id, i) => id === wantedIds[i])
      );
    });
  }

  async create(
    createDefectDto: CreateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
  ) {
    const [round, subCategories, inspector, room, subRoom] = await Promise.all([
      this.roundsRepo.findOneByOrFail({
        roundId: createDefectDto.roundId,
      }),
      this.subCategoriesRepo.findBy({
        subCategoryId: In(createDefectDto.subCategoryIds),
      }),
      this.usersRepo.findOneByOrFail({
        id: createDefectDto.inspectorId,
      }),
      this.roomsRepo.findOneByOrFail({
        roomId: createDefectDto.roomId,
      }),
      createDefectDto.subRoomId
        ? this.subRoomsRepo.findOneBy({
            subRoomId: createDefectDto.subRoomId,
          })
        : Promise.resolve(null),
    ]);

    if (LOCKED_ROUND_STATUSES.includes(round.status)) {
      throw new ForbiddenException(
        'Round is submitted or approved and cannot be edited',
      );
    }

    if (await this.hasDuplicateDefect(createDefectDto)) {
      throw new ConflictException(
        'มีรายการ Defect นี้อยู่แล้วในห้อง/ชั้นเดียวกัน',
      );
    }

    const defect = this.defectsRepo.create({
      ...createDefectDto,
      round,
      room,
      floor: { floorId: createDefectDto.floorId },
      subRoom,
      subCategories,
      inspector,
      imageFileSize: createDefectDto.imageFileSize,
    });

    const saved = await this.defectsRepo.save(defect);

    this.logDefectActivity(saved, {
      type: ActivityLogType.DEFECT_CREATED,
      color: 'purple',
      title: 'พบข้อบกพร่องใหม่',
      sub: this.buildLocationSub(saved),
    });

    return saved;
  }

  findAll() {
    return this.defectsRepo.find({
      relations: [
        'round',
        'room',
        'subRoom',
        'floor',
        'subCategories',
        'inspector',
      ],
    });
  }

  findOne(id: number) {
    return this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: [
        'round',
        'room',
        'subRoom',
        'floor',
        'subCategories',
        'subCategories.category',
        'inspector',
      ],
    });
  }

  async update(
    id: number,
    updateDefectDto: UpdateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
  ) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round'],
    });

    if (defect.round && LOCKED_ROUND_STATUSES.includes(defect.round.status)) {
      throw new ForbiddenException(
        'Round is submitted or approved and cannot be edited',
      );
    }

    // Assign primitive properties
    defect.description = updateDefectDto.description ?? defect.description;
    defect.severity = updateDefectDto.severity ?? defect.severity;
    defect.status = updateDefectDto.status ?? defect.status;
    if (updateDefectDto.imageUrl) defect.imageUrl = updateDefectDto.imageUrl;
    if (updateDefectDto.imageFileSize)
      defect.imageFileSize = updateDefectDto.imageFileSize;

    // Handle relations
    if (updateDefectDto.roomId) {
      defect.room = { roomId: updateDefectDto.roomId } as any;
    }
    if (updateDefectDto.floorId) {
      defect.floor = { floorId: updateDefectDto.floorId } as any;
    }
    if (updateDefectDto.subRoomId !== undefined) {
      defect.subRoom = updateDefectDto.subRoomId
        ? ({ subRoomId: updateDefectDto.subRoomId } as any)
        : null;
    }

    if (updateDefectDto.subCategoryIds) {
      const subCategories = await this.subCategoriesRepo.findBy({
        subCategoryId: In(updateDefectDto.subCategoryIds),
      });
      defect.subCategories = subCategories;
    }

    return this.defectsRepo.save(defect);
  }

  async contractorUpdate(
    contractorUpdateDto: ContractorUpdateDefectDto & {
      contractorImageUrl?: string;
      contractorImageFileSize?: number;
      linkPayload: LinkTokenPayload;
    },
  ) {
    if (contractorUpdateDto.linkPayload.role !== 'contractor') {
      throw new ForbiddenException('Only contractor links can update defects');
    }

    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: contractorUpdateDto.defectId },
      relations: [
        'round',
        'round.job',
        'round.job.contractor',
        'room',
        'subRoom',
      ],
    });

    const job = defect.round?.job;
    if (!job || job.jobId !== contractorUpdateDto.linkPayload.project_id) {
      throw new ForbiddenException('Defect does not belong to this project');
    }

    if (job.status === InspectionJobStatus.Locked) {
      throw new ForbiddenException('Locked jobs cannot be edited');
    }

    const assignedContractorId = job.contractor?.contractorId;
    if (!assignedContractorId) {
      throw new ForbiddenException('No contractor is assigned to this job');
    }

    if (
      contractorUpdateDto.contractorId !== undefined &&
      assignedContractorId !== contractorUpdateDto.contractorId
    ) {
      throw new ForbiddenException('Contractor cannot update this defect');
    }

    const wasAlreadyRepaired = defect.status === DefectStatus.REPAIRED;

    defect.status = DefectStatus.REPAIRED;
    defect.contractorNote = contractorUpdateDto.note ?? defect.contractorNote;
    defect.updatedBy = {
      contractorId: assignedContractorId,
    } as Contractor;

    if (contractorUpdateDto.contractorImageUrl) {
      defect.contractorImageUrl = contractorUpdateDto.contractorImageUrl;
      defect.contractorImageFileSize =
        contractorUpdateDto.contractorImageFileSize ??
        defect.contractorImageFileSize;
    }

    const saved = await this.defectsRepo.save(defect);

    void this.activityLogsService.log(
      job.jobId,
      {
        type: ActivityLogType.DEFECT_REPAIRED,
        color: 'green',
        title: 'ผู้รับเหมาแก้ไขข้อบกพร่องแล้ว',
        sub: this.buildLocationSub(saved),
      },
      saved.round?.roundId,
    );

    if (!wasAlreadyRepaired && saved.round?.roundId) {
      void this.maybeNotifyRepairThreshold(
        saved.round.roundId,
        job.jobId,
        job.projectName,
      );
    }

    return saved;
  }

  private async maybeNotifyRepairThreshold(
    roundId: number,
    jobId: number,
    projectName?: string,
  ) {
    try {
      const round = await this.roundsRepo.findOneBy({ roundId });
      if (!round || round.repairAlertSentAt) return;

      const [total, repaired] = await Promise.all([
        this.defectsRepo.count({ where: { round: { roundId } } }),
        this.defectsRepo.count({
          where: { round: { roundId }, status: DefectStatus.REPAIRED },
        }),
      ]);
      if (total === 0 || repaired / total < REPAIR_ALERT_THRESHOLD) return;

      round.repairAlertSentAt = new Date();
      await this.roundsRepo.save(round);

      const percent = Math.round((repaired / total) * 100);
      void this.notificationsService.create({
        type: NotificationType.ALERT,
        recipientRole: 'admin',
        message: `${projectName ?? 'โครงการ'}: ผู้รับเหมาซ่อมแล้ว ${repaired}/${total} รายการ (${percent}%)`,
        jobId,
        roundId,
      });
    } catch (error) {
      this.logger.error(
        `เช็คสัดส่วนซ่อมสำหรับ round ${roundId} ไม่สำเร็จ`,
        error as Error,
      );
    }
  }

  async remove(id: number) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round'],
    });

    if (defect.round && LOCKED_ROUND_STATUSES.includes(defect.round.status)) {
      throw new ForbiddenException(
        'Round is submitted or approved and cannot be edited',
      );
    }

    return this.defectsRepo.remove(defect);
  }

  findByRound(roundId: number) {
    return this.defectsRepo.find({
      where: { round: { roundId } },
      relations: [
        'round',
        'subCategories',
        'subCategories.category',
        'inspector',
        'room',
        'subRoom',
        'floor',
      ],
    });
  }
}
