import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { Repository, DataSource } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';
import { InspectionJobStatus } from './enums/inspection-job-status.enum';

@Injectable()
export class InspectionJobsService {
  constructor(
    @InjectRepository(InspectionJob)
    private readonly inspectionsRepo: Repository<InspectionJob>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
    @InjectRepository(HouseType)
    private readonly houseTypesRepo: Repository<HouseType>,
    @InjectRepository(Contractor)
    private readonly contractorsRepo: Repository<Contractor>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createInspectionJobDto: CreateInspectionJobDto) {
    const customer = await this.customersRepo.findOneBy({
      customerId: createInspectionJobDto.customerId,
    });
    if (!customer)
      throw new NotFoundException(
        `ไม่พบลูกค้า ID ${createInspectionJobDto.customerId}`,
      );

    const address = await this.addressesRepo.findOneBy({
      addressId: createInspectionJobDto.addressId,
    });
    if (!address)
      throw new NotFoundException(
        `ไม่พบที่อยู่ ID ${createInspectionJobDto.addressId}`,
      );

    const houseType = await this.houseTypesRepo.findOneBy({
      house_type_id: createInspectionJobDto.houseTypeId,
    });
    if (!houseType)
      throw new NotFoundException(
        `ไม่พบประเภทบ้าน ID ${createInspectionJobDto.houseTypeId}`,
      );

    let contractor: Contractor | null = null;
    if (createInspectionJobDto.contractorId) {
      contractor = await this.contractorsRepo.findOneBy({
        contractorId: createInspectionJobDto.contractorId,
      });
      if (!contractor)
        throw new NotFoundException(
          `ไม่พบผู้รับเหมา ID ${createInspectionJobDto.contractorId}`,
        );
    }

    const inspectionJob = this.inspectionsRepo.create({
      ...createInspectionJobDto,
      status: createInspectionJobDto.status ?? 'Draft',
      customer,
      address,
      houseType,
      contractor: contractor ?? undefined,
    });
    return this.inspectionsRepo.save(inspectionJob);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: InspectionJobStatus,
    search?: string,
    type?: string,
    sort?: 'asc' | 'desc',
    inspectionType?: string,
  ) {
    limit = Math.min(limit, 100);
    const query = this.inspectionsRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.address', 'address')
      .leftJoinAndSelect('job.houseType', 'houseType')
      .leftJoinAndSelect('job.contractor', 'contractor')
      .leftJoinAndSelect('job.rounds', 'rounds');

    if (status && (status as string) !== 'all') {
      query.andWhere('job.status = :status', { status });
    }

    if (type && type !== 'ทั้งหมด') {
      query.andWhere('houseType.name = :type', { type });
    }

    if (inspectionType && inspectionType !== 'ทั้งหมด') {
      const dbType =
        inspectionType === 'งานก่อสร้าง'
          ? 'CONSTRUCTION_INSPECTION'
          : 'DEFECT_INSPECTION';
      const thaiType =
        inspectionType === 'งานก่อสร้าง' ? 'ตรวจก่อสร้าง' : 'ตรวจ Defect';
      const engType =
        inspectionType === 'งานก่อสร้าง' ? 'Construction' : 'Defect';
      query.andWhere(
        '(job.inspectionType = :dbType OR job.inspectionType = :thaiType OR job.inspectionType = :engType)',
        { dbType, thaiType, engType },
      );
    }

    if (search) {
      query.andWhere(
        '(LOWER(job.projectName) LIKE LOWER(:search) OR LOWER(customer.fullName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    query
      .addSelect(
        `CASE 
          WHEN job.status = 'Pending' THEN 1
          WHEN job.status = 'Active' THEN 2
          WHEN job.status = 'Draft' THEN 3
          WHEN job.status = 'Completed' THEN 4
          WHEN job.status = 'Locked' THEN 5
          WHEN job.status = 'Cancelled' THEN 6
          ELSE 7
        END`,
        'status_order',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('job.jobId', sort === 'asc' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    // Fetch defect stats across ALL rounds for the job (to calculate contractor progress)
    const enrichedData = await Promise.all(
      data.map(async (job) => {
        let progress = 0;
        let isReadyForRound2 = false;

        if (job.rounds && job.rounds.length > 0) {
          const result = await this.dataSource.query(
            `SELECT
              COUNT(*) as total,
              SUM(CASE WHEN d.status IN ('repaired', 'verified') THEN 1 ELSE 0 END) as repaired
             FROM defect d
             INNER JOIN inspection_round r ON d.round_id = r.round_id
             WHERE r.job_id = $1`,
            [job.jobId],
          );

          const totalDefects = Number(result[0].total) || 0;
          const repairedDefects = Number(result[0].repaired) || 0;

          if (totalDefects > 0) {
            progress = (repairedDefects / totalDefects) * 100;
            if (progress >= 50) {
              isReadyForRound2 = true;
            }
          } else {
            progress = 100; // ไม่มี defect ถือว่าพร้อมเลย
          }
        }

        return {
          ...job,
          contractorProgress: progress,
          isReadyForRound2,
        };
      }),
    );

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const job = await this.inspectionsRepo.findOne({
      where: { jobId: id },
      relations: ['customer', 'address', 'houseType', 'contractor', 'rounds'],
    });
    if (!job) throw new NotFoundException(`ไม่พบงานตรวจ ID ${id}`);

    let progress = 0;
    let isReadyForRound2 = false;

    if (job.rounds && job.rounds.length > 0) {
      const result = await this.dataSource.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN d.status IN ('repaired', 'verified') THEN 1 ELSE 0 END) as repaired
         FROM defect d
         INNER JOIN inspection_round r ON d.round_id = r.round_id
         WHERE r.job_id = $1`,
        [job.jobId],
      );

      const totalDefects = Number(result[0].total) || 0;
      const repairedDefects = Number(result[0].repaired) || 0;

      if (totalDefects > 0) {
        progress = (repairedDefects / totalDefects) * 100;
        if (progress >= 50) {
          isReadyForRound2 = true;
        }
      } else {
        progress = 100;
      }
    }

    return {
      ...job,
      contractorProgress: progress,
      isReadyForRound2,
    };
  }

  async update(id: number, updateInspectionJobDto: UpdateInspectionJobDto) {
    const inspectionJob = await this.inspectionsRepo.findOneBy({ jobId: id });
    if (!inspectionJob) throw new NotFoundException(`ไม่พบงานตรวจ ID ${id}`);

    if (inspectionJob.status === InspectionJobStatus.Locked) {
      throw new ForbiddenException('Locked jobs cannot be edited');
    }

    if (updateInspectionJobDto.customerId) {
      const customer = await this.customersRepo.findOneBy({
        customerId: updateInspectionJobDto.customerId,
      });
      if (!customer)
        throw new NotFoundException(
          `ไม่พบลูกค้า ID ${updateInspectionJobDto.customerId}`,
        );
      inspectionJob.customer = customer;
    }

    if (updateInspectionJobDto.addressId) {
      const address = await this.addressesRepo.findOneBy({
        addressId: updateInspectionJobDto.addressId,
      });
      if (!address)
        throw new NotFoundException(
          `ไม่พบที่อยู่ ID ${updateInspectionJobDto.addressId}`,
        );
      inspectionJob.address = address;
    }

    if (updateInspectionJobDto.houseTypeId) {
      const houseType = await this.houseTypesRepo.findOneBy({
        house_type_id: updateInspectionJobDto.houseTypeId,
      });
      if (!houseType)
        throw new NotFoundException(
          `ไม่พบประเภทบ้าน ID ${updateInspectionJobDto.houseTypeId}`,
        );
      inspectionJob.houseType = houseType;
    }

    if (updateInspectionJobDto.contractorId) {
      const contractor = await this.contractorsRepo.findOneBy({
        contractorId: updateInspectionJobDto.contractorId,
      });
      if (!contractor)
        throw new NotFoundException(
          `ไม่พบผู้รับเหมา ID ${updateInspectionJobDto.contractorId}`,
        );
      inspectionJob.contractor = contractor;
    }

    // Assign only scalar column fields — NOT relation IDs (those are handled above as relations)
    if (updateInspectionJobDto.inspectionType !== undefined)
      inspectionJob.inspectionType = updateInspectionJobDto.inspectionType;
    if (updateInspectionJobDto.projectName !== undefined)
      inspectionJob.projectName = updateInspectionJobDto.projectName;
    if (updateInspectionJobDto.locationCoordinate !== undefined)
      inspectionJob.locationCoordinate =
        updateInspectionJobDto.locationCoordinate;
    if (updateInspectionJobDto.housePlanUrl !== undefined)
      inspectionJob.housePlanUrl = updateInspectionJobDto.housePlanUrl;
    if (updateInspectionJobDto.usableArea !== undefined)
      inspectionJob.usableArea = updateInspectionJobDto.usableArea;
    if (updateInspectionJobDto.projectImageUrl !== undefined)
      inspectionJob.projectImageUrl = updateInspectionJobDto.projectImageUrl;
    if (updateInspectionJobDto.status !== undefined)
      inspectionJob.status = updateInspectionJobDto.status;

    return this.inspectionsRepo.save(inspectionJob);
  }

  async getStatusMetadata(
    search?: string,
    type?: string,
    inspectionType?: string,
  ) {
    const statuses = [
      {
        key: InspectionJobStatus.Draft,
        label: 'แบบร่าง',
        bgClass: 'bg-grey-7',
        textColor: 'white',
      },
      {
        key: InspectionJobStatus.Active,
        label: 'กำลังดำเนินการ',
        bgClass: 'bg-blue-8',
        textColor: 'white',
      },
      {
        key: InspectionJobStatus.Pending,
        label: 'รออนุมัติ',
        bgClass: 'bg-orange-8',
        textColor: 'white',
      },
      {
        key: InspectionJobStatus.Completed,
        label: 'เสร็จสิ้น',
        bgClass: 'bg-green-7',
        textColor: 'white',
      },
      {
        key: InspectionJobStatus.Locked,
        label: 'ล็อค',
        bgClass: 'bg-red-7',
        textColor: 'white',
      },
      {
        key: InspectionJobStatus.Cancelled,
        label: 'ยกเลิก',
        bgClass: 'bg-red-9',
        textColor: 'white',
      },
    ];

    const query = this.inspectionsRepo
      .createQueryBuilder('job')
      .leftJoin('job.customer', 'customer')
      .leftJoin('job.houseType', 'houseType')
      .select('job.status', 'status')
      .addSelect('COUNT(job.jobId)', 'count')
      .groupBy('job.status');

    if (type && type !== 'ทั้งหมด') {
      query.andWhere('houseType.name = :type', { type });
    }

    if (inspectionType && inspectionType !== 'ทั้งหมด') {
      const dbType =
        inspectionType === 'งานก่อสร้าง'
          ? 'CONSTRUCTION_INSPECTION'
          : 'DEFECT_INSPECTION';
      const thaiType =
        inspectionType === 'งานก่อสร้าง' ? 'ตรวจก่อสร้าง' : 'ตรวจ Defect';
      const engType =
        inspectionType === 'งานก่อสร้าง' ? 'Construction' : 'Defect';
      query.andWhere(
        '(job.inspectionType = :dbType OR job.inspectionType = :thaiType OR job.inspectionType = :engType)',
        { dbType, thaiType, engType },
      );
    }

    if (search) {
      query.andWhere(
        '(LOWER(job.projectName) LIKE LOWER(:search) OR LOWER(customer.fullName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const countsQuery = await query.getRawMany();

    const countMap: Record<string, number> = {};
    for (const row of countsQuery as {
      status: string;
      count: string | number;
    }[]) {
      countMap[row.status] = Number(row.count);
    }

    return statuses.map((status) => ({
      ...status,
      count: countMap[status.key] || 0,
    }));
  }

  async remove(id: number) {
    const inspectionJob = await this.inspectionsRepo.findOneBy({ jobId: id });
    if (!inspectionJob) throw new NotFoundException(`ไม่พบงานตรวจ ID ${id}`);

    if (inspectionJob.status === InspectionJobStatus.Locked) {
      throw new ForbiddenException('Locked jobs cannot be edited');
    }

    return this.inspectionsRepo.softDelete(id);
  }
}
