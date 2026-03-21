import { Test, TestingModule } from '@nestjs/testing';
import { InspectionSummaryItemsController } from './inspection-summary-items.controller';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';

describe('InspectionSummaryItemsController', () => {
  let controller: InspectionSummaryItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionSummaryItemsController],
      providers: [InspectionSummaryItemsService],
    }).compile();

    controller = module.get<InspectionSummaryItemsController>(InspectionSummaryItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
