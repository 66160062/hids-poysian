import { Test, TestingModule } from '@nestjs/testing';
import { InspectorsController } from './inspectors.controller';
import { InspectorsService } from './inspectors.service';

describe('InspectorsController', () => {
  let controller: InspectorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectorsController],
      providers: [InspectorsService],
    }).compile();

    controller = module.get<InspectorsController>(InspectorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
