import { Injectable } from '@nestjs/common';
import { CreateHouseTypeDto } from './dto/create-house-type.dto';
import { UpdateHouseTypeDto } from './dto/update-house-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HouseType } from './entities/house-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HouseTypesService {
  constructor(
    @InjectRepository(HouseType)
    private readonly houseTypesRepo: Repository<HouseType>,
  ) {}

  create(createHouseTypeDto: CreateHouseTypeDto) {
    return this.houseTypesRepo.save(createHouseTypeDto);
  }

  findAll() {
    return this.houseTypesRepo.find();
  }

  findOne(id: number) {
    return this.houseTypesRepo.findOneByOrFail({ house_type_id: id });
  }

  update(id: number, updateHouseTypeDto: UpdateHouseTypeDto) {
    return this.houseTypesRepo.update(id, updateHouseTypeDto);
  }

  remove(id: number) {
    return this.houseTypesRepo.softDelete(id);
  }
}
