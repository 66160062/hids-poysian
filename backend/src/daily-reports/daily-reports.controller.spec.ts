import { Test, TestingModule } from '@nestjs/testing';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReportsService } from './daily-reports.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { jwtServiceMock } from 'src/auth/testing/jwt-service.mock';
import request from 'supertest';

describe('DailyReportsController', () => {
  let testingModule: TestingModule;
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

    testingModule = await Test.createTestingModule({
      controllers: [DailyReportsController],
      providers: [
        { provide: DailyReportsService, useValue: serviceMock },
        { provide: AuthService, useValue: { verifyJobAccess: jest.fn() } },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = testingModule.get<DailyReportsController>(
      DailyReportsController,
    );
    service = testingModule.get(DailyReportsService);
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

  it('requires a staff token to create reports, create rounds or clone a round', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).post('/daily-reports').expect(401);
      await request(app.getHttpServer())
        .post('/daily-reports/4/rounds')
        .expect(401);
      await request(app.getHttpServer())
        .get('/daily-reports/4/clone')
        .expect(401);
      expect(service.createRound).not.toHaveBeenCalled();
      expect(service.cloneLatestRound).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
