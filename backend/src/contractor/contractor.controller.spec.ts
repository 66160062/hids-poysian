import { Test, TestingModule } from '@nestjs/testing';
import { ContractorController } from './contractor.controller';
import { ContractorService } from './contractor.service';

describe('ContractorController', () => {
  let controller: ContractorController;
  let service: jest.Mocked<Pick<ContractorService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorController],
      providers: [{ provide: ContractorService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ContractorController>(ContractorController);
    service = module.get(ContractorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one contractor', () => {
    controller.findOne('5');

    expect(service.findOne).toHaveBeenCalledWith(5);
  });
});
