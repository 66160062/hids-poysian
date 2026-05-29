import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { Repository } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
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
  ) { }

  async create(createInspectionJobDto: CreateInspectionJobDto) {
    const customer = await this.customersRepo.findOneBy({
      customerId: createInspectionJobDto.customerId,
    });
    if (!customer)
      throw new NotFoundException(`ไม่พบลูกค้า ID ${createInspectionJobDto.customerId}`);

    const address = await this.addressesRepo.findOneBy({
      addressId: createInspectionJobDto.addressId,
    });
    if (!address)
      throw new NotFoundException(`ไม่พบที่อยู่ ID ${createInspectionJobDto.addressId}`);

    const houseType = await this.houseTypesRepo.findOneBy({
      house_type_id: createInspectionJobDto.houseTypeId,
    });
    if (!houseType)
      throw new NotFoundException(`ไม่พบประเภทบ้าน ID ${createInspectionJobDto.houseTypeId}`);

    const inspectionJob = this.inspectionsRepo.create({
      ...createInspectionJobDto,
      customer,
      address,
      houseType,
    });
    return this.inspectionsRepo.save(inspectionJob);
  }

  async findAll(page = 1, limit = 10, status?: InspectionJobStatus) {
    limit = Math.min(limit, 100);
    const [data, total] = await this.inspectionsRepo.findAndCount({
      relations: ['customer', 'address', 'houseType'],
      where: status ? { status } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { jobId: 'DESC' },
    });

    return {
      data,
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
      relations: ['customer', 'address', 'houseType'],
    });
    if (!job) throw new NotFoundException(`ไม่พบงานตรวจ ID ${id}`);
    return job;
  }

  async update(id: number, updateInspectionJobDto: UpdateInspectionJobDto) {
    const inspectionJob = await this.inspectionsRepo.findOneBy({ jobId: id });
    if (!inspectionJob) throw new NotFoundException(`ไม่พบงานตรวจ ID ${id}`);

    if (updateInspectionJobDto.customerId) {
      const customer = await this.customersRepo.findOneBy({
        customerId: updateInspectionJobDto.customerId,
      });
      if (!customer)
        throw new NotFoundException(`ไม่พบลูกค้า ID ${updateInspectionJobDto.customerId}`);
      inspectionJob.customer = customer;
    }

    if (updateInspectionJobDto.addressId) {
      const address = await this.addressesRepo.findOneBy({
        addressId: updateInspectionJobDto.addressId,
      });
      if (!address)
        throw new NotFoundException(`ไม่พบที่อยู่ ID ${updateInspectionJobDto.addressId}`);
      inspectionJob.address = address;
    }

    if (updateInspectionJobDto.houseTypeId) {
      const houseType = await this.houseTypesRepo.findOneBy({
        house_type_id: updateInspectionJobDto.houseTypeId,
      });
      if (!houseType)
        throw new NotFoundException(`ไม่พบประเภทบ้าน ID ${updateInspectionJobDto.houseTypeId}`);
      inspectionJob.houseType = houseType;
    }

    return this.inspectionsRepo.update(id, updateInspectionJobDto);
  }

  remove(id: number) {
    return this.inspectionsRepo.softDelete(id);
  }
}
