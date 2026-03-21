import { Test, TestingModule } from '@nestjs/testing';
import { RoomTemplatesService } from './room-templates.service';

describe('RoomTemplatesService', () => {
  let service: RoomTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomTemplatesService],
    }).compile();

    service = module.get<RoomTemplatesService>(RoomTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
