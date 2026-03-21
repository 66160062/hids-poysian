import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplateOptionsController } from './summary-template-options.controller';
import { SummaryTemplateOptionsService } from './summary-template-options.service';

describe('SummaryTemplateOptionsController', () => {
  let controller: SummaryTemplateOptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryTemplateOptionsController],
      providers: [SummaryTemplateOptionsService],
    }).compile();

    controller = module.get<SummaryTemplateOptionsController>(
      SummaryTemplateOptionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
