import { Test, TestingModule } from '@nestjs/testing';
import { ContractorController } from './contractor.controller';
import { ContractorService } from './contractor.service';

describe('ContractorController', () => {
  let controller: ContractorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorController],
      providers: [ContractorService],
    }).compile();

    controller = module.get<ContractorController>(ContractorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
