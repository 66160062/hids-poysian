import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplateOptionsService } from './summary-template-options.service';

describe('SummaryTemplateOptionsService', () => {
  let service: SummaryTemplateOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SummaryTemplateOptionsService],
    }).compile();

    service = module.get<SummaryTemplateOptionsService>(SummaryTemplateOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
