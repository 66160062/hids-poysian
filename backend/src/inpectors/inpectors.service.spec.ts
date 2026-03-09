import { Test, TestingModule } from '@nestjs/testing';
import { InpectorsService } from './inpectors.service';

describe('InpectorsService', () => {
  let service: InpectorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InpectorsService],
    }).compile();

    service = module.get<InpectorsService>(InpectorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
