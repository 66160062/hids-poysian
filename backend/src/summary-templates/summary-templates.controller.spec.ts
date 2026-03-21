import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplatesController } from './summary-templates.controller';
import { SummaryTemplatesService } from './summary-templates.service';

describe('SummaryTemplatesController', () => {
  let controller: SummaryTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryTemplatesController],
      providers: [SummaryTemplatesService],
    }).compile();

    controller = module.get<SummaryTemplatesController>(
      SummaryTemplatesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
