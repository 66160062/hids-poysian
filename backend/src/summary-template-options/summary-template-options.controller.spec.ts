import { Test, TestingModule } from '@nestjs/testing';
import { SummaryTemplateOptionsController } from './summary-template-options.controller';
import { SummaryTemplateOptionsService } from './summary-template-options.service';

describe('SummaryTemplateOptionsController', () => {
  let controller: SummaryTemplateOptionsController;
  let service: jest.Mocked<Pick<SummaryTemplateOptionsService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = { findOne: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryTemplateOptionsController],
      providers: [
        { provide: SummaryTemplateOptionsService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<SummaryTemplateOptionsController>(
      SummaryTemplateOptionsController,
    );
    service = module.get(SummaryTemplateOptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one option', () => {
    controller.findOne('9');

    expect(service.findOne).toHaveBeenCalledWith(9);
  });
});
