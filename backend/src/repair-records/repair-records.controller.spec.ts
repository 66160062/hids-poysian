import { Test, TestingModule } from '@nestjs/testing';
import { RepairRecordsController } from './repair-records.controller';
import { RepairRecordsService } from './repair-records.service';

describe('RepairRecordsController', () => {
  let controller: RepairRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairRecordsController],
      providers: [RepairRecordsService],
    }).compile();

    controller = module.get<RepairRecordsController>(RepairRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
