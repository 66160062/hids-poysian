import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let customersRepo: {
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    customersRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: customersRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('looks up a customer by id', async () => {
    customersRepo.findOneByOrFail.mockResolvedValue({ customerId: 4 });

    await expect(service.findOne(4)).resolves.toMatchObject({
      customerId: 4,
    });
    expect(customersRepo.findOneByOrFail).toHaveBeenCalledWith({
      customerId: 4,
    });
  });

  it('updates a customer by id', async () => {
    await service.update(4, { fullName: 'Somchai' } as never);

    expect(customersRepo.update).toHaveBeenCalledWith(
      { customerId: 4 },
      { fullName: 'Somchai' },
    );
  });

  it('soft-deletes a customer by id', async () => {
    await service.remove(4);

    expect(customersRepo.softDelete).toHaveBeenCalledWith(4);
  });
});
