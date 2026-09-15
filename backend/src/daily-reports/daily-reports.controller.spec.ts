import { Test, TestingModule } from '@nestjs/testing';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReportsService } from './daily-reports.service';
import { AuthService } from 'src/auth/auth.service';

describe('DailyReportsController', () => {
  let controller: DailyReportsController;
  let service: jest.Mocked<
    Pick<
      DailyReportsService,
      'findRoundsByJob' | 'createRound' | 'cloneLatestRound'
    >
  >;

  beforeEach(async () => {
    const serviceMock = {
      findRoundsByJob: jest.fn(),
      createRound: jest.fn(),
      cloneLatestRound: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyReportsController],
      providers: [
        { provide: DailyReportsService, useValue: serviceMock },
        { provide: AuthService, useValue: { verifyJobAccess: jest.fn() } },
      ],
    }).compile();

    controller = module.get<DailyReportsController>(DailyReportsController);
    service = module.get(DailyReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when listing rounds for a job', () => {
    controller.findRoundsByJob('4');

    expect(service.findRoundsByJob).toHaveBeenCalledWith(4);
  });

  it('converts the route param to a number when creating a round', () => {
    controller.createRound('4', { scheduledDate: '2026-08-10' } as never);

    expect(service.createRound).toHaveBeenCalledWith(4, {
      scheduledDate: '2026-08-10',
    });
  });

  it('converts the route param to a number when cloning the latest round', () => {
    controller.cloneLatestRound('4');

    expect(service.cloneLatestRound).toHaveBeenCalledWith(4);
  });
});
