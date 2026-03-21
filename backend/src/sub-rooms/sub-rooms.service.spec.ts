import { Test, TestingModule } from '@nestjs/testing';
import { SubRoomsService } from './sub-rooms.service';

describe('SubRoomsService', () => {
  let service: SubRoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubRoomsService],
    }).compile();

    service = module.get<SubRoomsService>(SubRoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
