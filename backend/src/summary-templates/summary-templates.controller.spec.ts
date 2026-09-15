import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplatesController } from './summary-templates.controller';
import { SummaryTemplatesService } from './summary-templates.service';

describe('SummaryTemplatesController', () => {
  let controller: SummaryTemplatesController;
  let service: jest.Mocked<Pick<SummaryTemplatesService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = { findOne: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryTemplatesController],
      providers: [{ provide: SummaryTemplatesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SummaryTemplatesController>(
      SummaryTemplatesController,
    );
    service = module.get(SummaryTemplatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one template', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });
});
