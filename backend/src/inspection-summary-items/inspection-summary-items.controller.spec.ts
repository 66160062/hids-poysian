import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { InspectionSummaryItemsController } from './inspection-summary-items.controller';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { AuthService } from 'src/auth/auth.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';

describe('InspectionSummaryItemsController', () => {
  let controller: InspectionSummaryItemsController;
  let service: jest.Mocked<
    Pick<
      InspectionSummaryItemsService,
      'findOne' | 'findByRound' | 'deleteByRound' | 'deleteByRoundAndTemplate'
    >
  >;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      findByRound: jest.fn(),
      deleteByRound: jest.fn(),
      deleteByRoundAndTemplate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionSummaryItemsController],
      providers: [
        { provide: InspectionSummaryItemsService, useValue: serviceMock },
        {
          provide: AuthService,
          useValue: {
            verifyJobAccess: jest.fn(),
            verifyRoundAccess: jest.fn(),
          },
        },
        { provide: getRepositoryToken(InspectionRound), useValue: {} },
        { provide: getRepositoryToken(InspectionSummaryItem), useValue: {} },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<InspectionSummaryItemsController>(
      InspectionSummaryItemsController,
    );
    service = module.get(InspectionSummaryItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one item', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('forwards the parsed roundId when listing items for a round', () => {
    controller.findByRound(7);

    expect(service.findByRound).toHaveBeenCalledWith(7);
  });

  it('forwards both parsed ids when deleting by round and template', () => {
    controller.deleteByRoundAndTemplate(7, 2);

    expect(service.deleteByRoundAndTemplate).toHaveBeenCalledWith(7, 2);
  });
});
