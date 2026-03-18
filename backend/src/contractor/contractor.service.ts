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
  ) {}
  async create(createContractorDto: CreateContractorDto) {
    return await this.contractorRepo.save(createContractorDto);
  }

  async findAll() {
    return await this.contractorRepo.find();
  }

  async findOne(id: number) {
    return await this.contractorRepo.findOneByOrFail({ contractor_id: id });
  }

  async update(id: number, updateContractorDto: UpdateContractorDto) {
    return await this.contractorRepo.update(id, updateContractorDto);
  }

  async remove(id: number) {
    return await this.contractorRepo.softDelete(id);
  }
}
