import { Test, TestingModule } from '@nestjs/testing';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';

describe('InspectionSummaryItemsService', () => {
  let service: InspectionSummaryItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionSummaryItemsService],
    }).compile();

    service = module.get<InspectionSummaryItemsService>(
      InspectionSummaryItemsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
