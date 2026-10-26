import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConstructionDailyReportsController } from './construction-daily-reports.controller';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from 'src/auth/auth.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

describe('ConstructionDailyReportsController', () => {
  let testingModule: TestingModule;
  let controller: ConstructionDailyReportsController;
  let service: jest.Mocked<
    Pick<ConstructionDailyReportsService, 'create' | 'findByRound'>
  >;

  const authServiceMock = { verifyRoundAccess: jest.fn() };

  beforeEach(async () => {
    authServiceMock.verifyRoundAccess.mockReset();
    const serviceMock = { create: jest.fn(), findByRound: jest.fn() };

    testingModule = await Test.createTestingModule({
      controllers: [ConstructionDailyReportsController],
      providers: [
        { provide: ConstructionDailyReportsService, useValue: serviceMock },
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: getRepositoryToken(InspectionRound),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ job: { jobId: 1 } }),
          },
        },
      ],
    }).compile();

    controller = testingModule.get<ConstructionDailyReportsController>(
      ConstructionDailyReportsController,
    );
    service = testingModule.get(ConstructionDailyReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the payload string, photo names, files, and requesting user id to the service', () => {
    const files = { panoramaFile: [{ buffer: Buffer.from('p') }] } as never;

    controller.create('{"roundId":1}', ['หน้าบ้าน'], files, {
      user: { sub: 42 },
    } as never);

    expect(service.create).toHaveBeenCalledWith(
      '{"roundId":1}',
      ['หน้าบ้าน'],
      files,
      42,
    );
  });

  it('passes undefined as the user id when the request has no authenticated user', () => {
    controller.create('{"roundId":1}', [], {}, {} as never);

    expect(service.create).toHaveBeenCalledWith(
      '{"roundId":1}',
      [],
      {},
      undefined,
    );
  });

  it('converts the route param to a number when looking up a report by round', () => {
    controller.findByRound('7');

    expect(service.findByRound).toHaveBeenCalledWith(7);
  });

  it('rejects reads of a round report when round access is denied', async () => {
    authServiceMock.verifyRoundAccess.mockRejectedValue(
      new UnauthorizedException(),
    );
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer())
        .get('/construction-daily-reports/round/3')
        .expect(401);
      expect(service.findByRound).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('serves a round report once round access is verified', async () => {
    authServiceMock.verifyRoundAccess.mockResolvedValue({ sub: 1 });
    service.findByRound.mockResolvedValue(null);
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer())
        .get('/construction-daily-reports/round/3')
        .expect(200);
      expect(service.findByRound).toHaveBeenCalledWith(3);
    } finally {
      await app.close();
    }
  });
});
