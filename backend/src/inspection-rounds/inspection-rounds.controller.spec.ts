import { Test, TestingModule } from '@nestjs/testing';
import { InspectionRoundsController } from './inspection-rounds.controller';
import { InspectionRoundsService } from './inspection-rounds.service';

describe('InspectionRoundsController', () => {
  let controller: InspectionRoundsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionRoundsController],
      providers: [InspectionRoundsService],
    }).compile();

    controller = module.get<InspectionRoundsController>(
      InspectionRoundsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
