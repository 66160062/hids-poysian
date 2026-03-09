import { Test, TestingModule } from '@nestjs/testing';
import { InpectorsController } from './inpectors.controller';
import { InpectorsService } from './inpectors.service';

describe('InpectorsController', () => {
  let controller: InpectorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InpectorsController],
      providers: [InpectorsService],
    }).compile();

    controller = module.get<InpectorsController>(InpectorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
