import { Injectable } from '@nestjs/common';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contractor } from './entities/contractor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractorService {
  constructor(
    @InjectRepository(Contractor)
    private readonly contractorRepo: Repository<Contractor>,
  ) { }
  async create(createContractorDto: CreateContractorDto) {
    const contractor = this.contractorRepo.create(createContractorDto);
    return await this.contractorRepo.save(contractor);
  }

  async findAll() {
    return await this.contractorRepo.find();
  }

  async findOne(id: number) {
    return await this.contractorRepo.findOneByOrFail({ contractorId: id });
  }

  async update(id: number, updateContractorDto: UpdateContractorDto) {
    return await this.contractorRepo.update({ contractorId: id }, updateContractorDto);
  }

  async remove(id: number) {
    return await this.contractorRepo.softDelete(id);
  }
}
