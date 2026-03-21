import { Test, TestingModule } from '@nestjs/testing';
import { RoomTemplatesController } from './room-templates.controller';
import { RoomTemplatesService } from './room-templates.service';

describe('RoomTemplatesController', () => {
  let controller: RoomTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTemplatesController],
      providers: [RoomTemplatesService],
    }).compile();

    controller = module.get<RoomTemplatesController>(RoomTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
