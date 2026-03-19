import { Test, TestingModule } from '@nestjs/testing';
import { InspectionRoundsService } from './inspection-rounds.service';

describe('InspectionRoundsService', () => {
  let service: InspectionRoundsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionRoundsService],
    }).compile();

    service = module.get<InspectionRoundsService>(InspectionRoundsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
