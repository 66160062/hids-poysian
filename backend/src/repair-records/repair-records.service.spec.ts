import { Test, TestingModule } from '@nestjs/testing';
import { RepairRecordsService } from './repair-records.service';

describe('RepairRecordsService', () => {
  let service: RepairRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepairRecordsService],
    }).compile();

    service = module.get<RepairRecordsService>(RepairRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
