import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplatesService } from './summary-templates.service';

describe('SummaryTemplatesService', () => {
  let service: SummaryTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SummaryTemplatesService],
    }).compile();

    service = module.get<SummaryTemplatesService>(SummaryTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
