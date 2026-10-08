import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
  ) {}
  create(createCustomerDto: CreateCustomerDto) {
    return this.customersRepo.save(createCustomerDto);
  }

  findAll() {
    return this.customersRepo.find({
      order: { updatedAt: 'DESC', customerId: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.customersRepo.findOneByOrFail({ customerId: id });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customersRepo.findOneByOrFail({ customerId: id });
    Object.assign(customer, updateCustomerDto);
    return this.customersRepo.save(customer);
  }

  remove(id: number) {
    return this.customersRepo.softDelete(id);
  }
}
