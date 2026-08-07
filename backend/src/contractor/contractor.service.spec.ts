import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContractorService } from './contractor.service';
import { Contractor } from './entities/contractor.entity';

describe('ContractorService', () => {
  let service: ContractorService;
  let contractorRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    contractorRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorService,
        { provide: getRepositoryToken(Contractor), useValue: contractorRepo },
      ],
    }).compile();

    service = module.get<ContractorService>(ContractorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds a Contractor entity from the dto before saving', async () => {
    const dto = { fullName: 'ช่างสมชาย', phoneNumber: '0812345678' };
    contractorRepo.create.mockReturnValue(dto);
    contractorRepo.save.mockResolvedValue({ contractorId: 5, ...dto });

    await expect(service.create(dto as never)).resolves.toMatchObject({
      contractorId: 5,
    });
    expect(contractorRepo.create).toHaveBeenCalledWith(dto);
  });

  it('looks up a contractor by id', async () => {
    contractorRepo.findOneByOrFail.mockResolvedValue({ contractorId: 5 });

    await expect(service.findOne(5)).resolves.toMatchObject({
      contractorId: 5,
    });
  });

  it('soft-deletes a contractor by id', async () => {
    await service.remove(5);

    expect(contractorRepo.softDelete).toHaveBeenCalledWith(5);
  });
});
