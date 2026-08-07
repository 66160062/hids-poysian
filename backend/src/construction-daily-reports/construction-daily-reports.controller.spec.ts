import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConstructionDailyReportsController } from './construction-daily-reports.controller';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';

describe('ConstructionDailyReportsController', () => {
  let controller: ConstructionDailyReportsController;
  let service: jest.Mocked<Pick<ConstructionDailyReportsService, 'create' | 'findByRound'>>;

  beforeEach(async () => {
    const serviceMock = { create: jest.fn(), findByRound: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstructionDailyReportsController],
      providers: [
        { provide: ConstructionDailyReportsService, useValue: serviceMock },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ConstructionDailyReportsController>(
      ConstructionDailyReportsController,
    );
    service = module.get(ConstructionDailyReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the payload string, photo names, files, and requesting user id to the service', () => {
    const files = { panoramaFile: [{ buffer: Buffer.from('p') }] } as never;

    controller.create(
      '{"roundId":1}',
      ['หน้าบ้าน'],
      files,
      { user: { sub: 42 } } as never,
    );

    expect(service.create).toHaveBeenCalledWith(
      '{"roundId":1}',
      ['หน้าบ้าน'],
      files,
      42,
    );
  });

  it('passes undefined as the user id when the request has no authenticated user', () => {
    controller.create('{"roundId":1}', [], {}, {} as never);

    expect(service.create).toHaveBeenCalledWith('{"roundId":1}', [], {}, undefined);
  });

  it('converts the route param to a number when looking up a report by round', () => {
    controller.findByRound('7');

    expect(service.findByRound).toHaveBeenCalledWith(7);
  });
});
