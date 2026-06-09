import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
  ) {}
  create(createAddressDto: CreateAddressDto) {
    return this.addressesRepo.save(createAddressDto);
  }

  findAll() {
    return this.addressesRepo.find();
  }

  findOne(id: number) {
    return this.addressesRepo.findOneByOrFail({ addressId: id });
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return this.addressesRepo.update({ addressId: id }, updateAddressDto);
  }

  remove(id: number) {
    return this.addressesRepo.softDelete(id);
  }
}
