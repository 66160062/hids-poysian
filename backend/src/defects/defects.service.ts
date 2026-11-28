import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { Defect } from './entities/defect.entity';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { ContractorUpdateDefectDto } from './dto/contractor-update-defect.dto';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { Floor } from 'src/floor/entities/floor.entity';
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
import { DefectNoteTranslator } from './defect-note-translator.service';
import { normalizeFloorLabel } from 'src/floor/floor-label.util';

type LinkTokenPayload = {
  project_id: number;
  role: string;
};

// รอบตรวจที่ยื่นอนุมัติ (หรืออนุมัติแล้ว) ห้ามแก้ไข/ลบ defect — ต้องตรงกับ LOCKED_STATUSES ฝั่ง frontend (useRoundLock.ts)
const LOCKED_ROUND_STATUSES = ['SUBMITTED', 'APPROVED'];

// แอดมินคือคนตรวจทานรอบที่ inspector ยื่นมาก่อนกดอนุมัติ จึงยังแก้ตอน SUBMITTED ได้
// แต่พออนุมัติแล้วล็อกเหมือนกันทุก role เพราะรายงานส่งถึงลูกค้าไปแล้ว
const ADMIN_LOCKED_ROUND_STATUSES = ['APPROVED'];

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

    @InjectRepository(Floor)
    private readonly floorsRepo: Repository<Floor>,

    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly noteTranslator: DefectNoteTranslator,
  ) {}

  // ประกอบข้อความ "ห้องนั่งเล่น • ห้องนอนชั้น2" จาก room/subRoom ของ defect ที่ผ่านการ save แล้ว
  private buildLocationSub(defect: Defect): string | undefined {
    const parts = [defect.room?.roomName, defect.subRoom?.roomName].filter(
      (part): part is string => !!part,
    );
    return parts.length ? parts.join(' • ') : undefined;
  }

  // ฉบับอังกฤษของข้อความตำแหน่งเดียวกัน — ใช้ roomNameEn ถ้ามี ไม่งั้นใช้ชื่อไทย (ยังดีกว่าไม่มีตำแหน่ง)
  private buildLocationSubEn(defect: Defect): string | undefined {
    const parts = [
      defect.room?.roomNameEn || defect.room?.roomName,
      defect.subRoom?.roomNameEn || defect.subRoom?.roomName,
    ].filter((part): part is string => !!part);
    return parts.length ? parts.join(' • ') : undefined;
  }

  private logDefectActivity(defect: Defect, entry: LogEntryInput) {
    const roundId = defect.round?.roundId;
    if (!roundId) return;
    void this.activityLogsService.logForRound(roundId, entry);
  }
  // เช็คซ้ำกันกดบันทึกซ้ำโดยไม่ตั้งใจ แบบเดียวกับฝั่ง frontend
  // เช็คซ้ำเฉพาะการบันทึกที่ไม่มีรูป (กันกดบันทึกซ้ำโดยไม่ตั้งใจ) แบบเดียวกับฝั่ง frontend
  // (isDuplicateDefect ใน AddDefectPage.vue) แต่ query จาก DB สด กันเคส 2 inspector คนละ session บันทึกจุดเดียวกันพร้อมกัน ซึ่ง local store ฝั่ง frontend มองไม่เห็นกัน
  // มีรูปแนบ: ซ้ำก็ต่อเมื่อขนาดไฟล์รูปเท่ากันด้วย (กัน retry หลัง timeout สร้างซ้ำ แต่รูปใหม่ที่ขนาดต่างยังบันทึกซ้ำได้)
  private async hasDuplicateDefect(
    dto: CreateDefectDto & { imageFileSize?: number },
    withPhoto = false,
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
      if (withPhoto && candidate.imageFileSize !== dto.imageFileSize) {
        return false;
      }
      const ids = candidate.subCategories
        .map((s) => s.subCategoryId)
        .sort((a, b) => a - b);
      return (
        ids.length === wantedIds.length &&
        ids.every((id, i) => id === wantedIds[i])
      );
    });
  }

  // ชั้นที่ผู้ตรวจพิมพ์เอง (เลือก "ชั้นอื่นๆ"): ใช้แถวเดิมถ้ามีชื่อเดียวกัน (ไม่สนตัวพิมพ์/ช่องว่าง)
  // ไม่งั้นสร้างแถวใหม่ ทุกหน้าที่แสดง defect.floor.label จึงได้ชื่อจริงโดยไม่ต้องแก้ และชื่อนี้จะขึ้นในรายการชั้นครั้งถัดไป
  // ตาราง floor มีไม่กี่แถว เทียบใน JS ได้เลย ไม่ต้องเขียน ILIKE (และไม่ต้อง escape % _ จากข้อความผู้ใช้)
  private async resolveCustomFloor(label: string): Promise<number> {
    const normalize = normalizeFloorLabel;
    const wanted = normalize(label);
    const floors = await this.floorsRepo.find();
    const existing = floors.find(
      (floor) =>
        normalize(floor.label) === wanted ||
        (!!floor.labelEn && normalize(floor.labelEn) === wanted),
    );
    if (existing) return existing.floorId;

    const created = await this.floorsRepo.save(
      this.floorsRepo.create({
        label: label.trim().replace(/\s+/g, ' '),
        labelEn: null,
      }),
    );
    return created.floorId;
  }

  private assertRoundEditable(roundStatus: string, role?: string): void {
    const isAdmin = role === 'admin';
    const lockedStatuses = isAdmin
      ? ADMIN_LOCKED_ROUND_STATUSES
      : LOCKED_ROUND_STATUSES;

    if (lockedStatuses.includes(roundStatus)) {
      throw new ForbiddenException(
        isAdmin
          ? 'Round is approved and cannot be edited'
          : 'Round is submitted or approved and cannot be edited',
      );
    }
  }

  // uploadImage ถูกเรียกหลังเช็ครอบล็อก/ซ้ำผ่านแล้วเท่านั้น จะได้ไม่ต้องบีบอัด+อัปโหลดรูปทิ้ง
  // ทั้งที่ request จะถูกปฏิเสธอยู่ดี (เดิมรูปถูกอัปโหลดก่อนแล้วค้างอยู่ใน storage)
  async create(
    createDefectDto: CreateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
    role?: string,
    uploadImage?: () => Promise<string>,
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

    this.assertRoundEditable(round.status, role);

    // หลังเช็ครอบล็อก (รอบล็อกแล้วไม่ต้องสร้างชั้นทิ้ง) แต่ก่อนเช็คซ้ำ (ต้องเทียบด้วย floorId จริง)
    if (createDefectDto.customFloorLabel) {
      createDefectDto.floorId = await this.resolveCustomFloor(
        createDefectDto.customFloorLabel,
      );
    }

    // มีรูปแนบ = อาจตั้งใจบันทึกรายละเอียดเดิมแต่คนละรูป จึงซ้ำเฉพาะเมื่อขนาดรูปเท่ากันด้วย
    if (await this.hasDuplicateDefect(createDefectDto, !!uploadImage)) {
      throw new ConflictException(
        'มีรายการ Defect นี้อยู่แล้วในห้อง/ชั้นเดียวกัน',
      );
    }

    if (uploadImage) {
      createDefectDto.imageUrl = await uploadImage();
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
      plan: createDefectDto.planId ? { planId: createDefectDto.planId } : null,
      planX: createDefectDto.planX ?? null,
      planY: createDefectDto.planY ?? null,
      locationZone: createDefectDto.locationZone ?? null,
    });

    const saved = await this.defectsRepo.save(defect);

    // แปลหมายเหตุเป็นอังกฤษตามหลัง ไม่รอผล — ผู้ตรวจบันทึกได้ทันทีแม้ LLM ช้าหรือล่ม
    void this.noteTranslator.translateAndStore(saved.defectId, {
      description: saved.description,
    });

    this.logDefectActivity(saved, {
      type: ActivityLogType.DEFECT_CREATED,
      color: 'purple',
      title: 'พบข้อบกพร่องใหม่',
      sub: this.buildLocationSub(saved),
      titleEn: 'New defect found',
      subEn: this.buildLocationSubEn(saved),
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
        'plan',
        'plan.floor',
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
        'plan',
        'plan.floor',
      ],
    });
  }

  async update(
    id: number,
    updateDefectDto: UpdateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
    role?: string,
    uploadImage?: () => Promise<string>,
  ) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round'],
    });

    if (defect.round) {
      this.assertRoundEditable(defect.round.status, role);
    }

    if (updateDefectDto.customFloorLabel) {
      updateDefectDto.floorId = await this.resolveCustomFloor(
        updateDefectDto.customFloorLabel,
      );
    }

    if (uploadImage) {
      updateDefectDto.imageUrl = await uploadImage();
    }

    // Assign primitive properties
    const descriptionChanged =
      updateDefectDto.description !== undefined &&
      updateDefectDto.description !== defect.description;
    defect.description = updateDefectDto.description ?? defect.description;
    // คำแปลเดิมใช้กับข้อความใหม่ไม่ได้ ล้างทิ้งแล้วแปลใหม่หลังบันทึก
    if (descriptionChanged) defect.descriptionEn = null;
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

    if (updateDefectDto.planId !== undefined) {
      defect.plan = updateDefectDto.planId
        ? ({ planId: updateDefectDto.planId } as any)
        : null;
    }
    if (updateDefectDto.planX !== undefined) {
      defect.planX = updateDefectDto.planX;
    }
    if (updateDefectDto.planY !== undefined) {
      defect.planY = updateDefectDto.planY;
    }
    if (updateDefectDto.locationZone !== undefined) {
      defect.locationZone = updateDefectDto.locationZone;
    }

    if (updateDefectDto.subCategoryIds) {
      const subCategories = await this.subCategoriesRepo.findBy({
        subCategoryId: In(updateDefectDto.subCategoryIds),
      });
      defect.subCategories = subCategories;
    }

    const saved = await this.defectsRepo.save(defect);
    if (descriptionChanged) {
      void this.noteTranslator.translateAndStore(saved.defectId, {
        description: saved.description,
      });
    }
    return saved;
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
    const noteChanged =
      contractorUpdateDto.note !== undefined &&
      contractorUpdateDto.note !== defect.contractorNote;
    defect.contractorNote = contractorUpdateDto.note ?? defect.contractorNote;
    if (noteChanged) defect.contractorNoteEn = null;
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

    if (noteChanged) {
      void this.noteTranslator.translateAndStore(saved.defectId, {
        contractorNote: saved.contractorNote,
      });
    }

    void this.activityLogsService.log(
      job.jobId,
      {
        type: ActivityLogType.DEFECT_REPAIRED,
        color: 'green',
        title: 'ผู้รับเหมาแก้ไขข้อบกพร่องแล้ว',
        sub: this.buildLocationSub(saved),
        titleEn: 'Contractor repaired a defect',
        subEn: this.buildLocationSubEn(saved),
      },
      saved.round?.roundId,
    );

    if (!wasAlreadyRepaired && saved.round?.roundId) {
      void this.maybeNotifyRepairThreshold(
        saved.round.roundId,
        job.jobId,
        job.projectName,
        job.projectNameEn,
      );
    }

    return saved;
  }

  private async maybeNotifyRepairThreshold(
    roundId: number,
    jobId: number,
    projectName?: string,
    projectNameEn?: string | null,
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
        messageEn: `${projectNameEn || projectName || 'Project'}: contractor has repaired ${repaired}/${total} items (${percent}%)`,
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

  async remove(id: number, role?: string) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round'],
    });

    if (defect.round) {
      this.assertRoundEditable(defect.round.status, role);
    }

    return this.defectsRepo.remove(defect);
  }

  // ไม่ join 'round' เพราะทุกแถวเป็นรอบเดียวกัน (เดิมแถว round ทั้งแถว รวม token ลูกค้า/ช่าง
  // และข้อความ AI ถูกส่งซ้ำในทุก defect) frontend ไม่ได้อ่าน defect.round จาก list นี้
  private static readonly LIST_RELATIONS = [
    'subCategories',
    'subCategories.category',
    'inspector',
    'room',
    'subRoom',
    'floor',
    'plan',
    'plan.floor',
  ];

  // กำหนด roundDefectNumber (1, 2, 3...) ตาม defectId ASC ภายในรอบเดียวกัน
  // ใช้แทนการแสดง defectId จริง (global auto-increment) เพื่อให้แต่ละรอบนับจาก 1 ใหม่
  private assignRoundNumbers<T extends { defectId: number }>(
    defects: T[],
  ): (T & { roundDefectNumber: number })[] {
    return defects.map((d, index) => ({ ...d, roundDefectNumber: index + 1 }));
  }

  async findByRound(roundId: number) {
    const defects = await this.defectsRepo.find({
      where: { round: { roundId } },
      relations: DefectsService.LIST_RELATIONS,
      order: { defectId: 'ASC' },
    });
    return this.assignRoundNumbers(defects);
  }

  // defect ตัวเดียวในรูปร่างเดียวกับ findByRound ใช้ตอบกลับหลังสร้าง ให้ frontend ใส่ลง list
  // ได้ทันทีโดยไม่ต้องดึงทั้งรอบใหม่
  // roundDefectNumber = ลำดับของ defect นี้ใน round (นับจาก defectId ASC)
  async findListItem(defectId: number) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId },
      relations: [...DefectsService.LIST_RELATIONS, 'round'],
    });

    // นับจำนวน defect ในรอบเดียวกันที่มี defectId น้อยกว่า → ได้ลำดับที่ตัวนี้ควรเป็น
    const roundId = defect.round?.roundId;
    let roundDefectNumber = 1;
    if (roundId) {
      const preceding = await this.defectsRepo.count({
        where: { round: { roundId }, defectId: LessThan(defectId) },
      });
      roundDefectNumber = preceding + 1;
    }

    return { ...defect, roundDefectNumber };
  }
}
