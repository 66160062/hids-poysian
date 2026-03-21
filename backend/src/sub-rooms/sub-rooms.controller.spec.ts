import { Test, TestingModule } from '@nestjs/testing';
import { SubRoomsController } from './sub-rooms.controller';
import { SubRoomsService } from './sub-rooms.service';

describe('SubRoomsController', () => {
  let controller: SubRoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubRoomsController],
      providers: [SubRoomsService],
    }).compile();

    controller = module.get<SubRoomsController>(SubRoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
