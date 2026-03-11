import { Injectable } from '@nestjs/common';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { Repository } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';

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
  ) {}

  async create(createInspectionJobDto: CreateInspectionJobDto) {
    const customer = await this.customersRepo.findOneByOrFail({
      customer_id: createInspectionJobDto.customerId,
    });
    const address = await this.addressesRepo.findOneByOrFail({
      address_id: createInspectionJobDto.addressId,
    });
    const houseType = await this.houseTypesRepo.findOneByOrFail({
      house_type_id: createInspectionJobDto.houseTypeId,
    });
    const inspectionJob = this.inspectionsRepo.create({
      ...createInspectionJobDto,
      customer,
      address,
      houseType,
    });
    return this.inspectionsRepo.save(inspectionJob);
  }

  findAll() {
    return this.inspectionsRepo.find();
  }

  findOne(id: number) {
    return this.inspectionsRepo.findOneByOrFail({ jobId: id });
  }

  update(id: number, updateInspectionJobDto: UpdateInspectionJobDto) {
    return this.inspectionsRepo.update(id, updateInspectionJobDto);
  }

  remove(id: number) {
    return this.inspectionsRepo.softDelete(id);
  }
}
