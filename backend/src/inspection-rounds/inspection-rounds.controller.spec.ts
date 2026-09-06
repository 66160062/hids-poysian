import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectionRoundsController } from './inspection-rounds.controller';
import { InspectionRoundsService } from './inspection-rounds.service';
import { ReportsService } from 'src/reports/reports.service';
import { AuthService } from 'src/auth/auth.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';

describe('InspectionRoundsController', () => {
  let controller: InspectionRoundsController;
  let service: jest.Mocked<
    Pick<
      InspectionRoundsService,
      'findByWeek' | 'findByMonth' | 'submit' | 'approveReport'
    >
  >;
  let reports: jest.Mocked<Pick<ReportsService, 'getCachedReportUrl'>>;

  beforeEach(async () => {
    const serviceMock = {
      findByWeek: jest.fn(),
      findByMonth: jest.fn(),
      submit: jest.fn(),
      approveReport: jest.fn(),
    };
    const reportsMock = { getCachedReportUrl: jest.fn() };
    const aiSummaryMock = { generateWithProvider: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionRoundsController],
      providers: [
        { provide: InspectionRoundsService, useValue: serviceMock },
        { provide: ReportsService, useValue: reportsMock },
        { provide: AiSummaryService, useValue: aiSummaryMock },
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: AuthService, useValue: { verifyJobAccess: jest.fn() } },
        { provide: getRepositoryToken(InspectionRound), useValue: {} },
      ],
    }).compile();

    controller = module.get<InspectionRoundsController>(
      InspectionRoundsController,
    );
    service = module.get(InspectionRoundsService);
    reports = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the inspector id route param to a number when listing by week', () => {
    controller.findByWeek('9', '2026-08-01');

    expect(service.findByWeek).toHaveBeenCalledWith(9, '2026-08-01');
  });

  it('converts the inspector id route param to a number when listing by month', async () => {
    await controller.getRoundsByMonth('9', '2026-08-01');

    expect(service.findByMonth).toHaveBeenCalledWith(9, '2026-08-01');
  });

  it('forwards the cached report url and its generatedAt timestamp from the service', async () => {
    const generatedAt = new Date('2026-01-01T00:00:00Z');
    reports.getCachedReportUrl.mockResolvedValue({
      url: 'https://example.com/r.pdf',
      generatedAt,
    });

    await expect(controller.getReport('4')).resolves.toEqual({
      url: 'https://example.com/r.pdf',
      generatedAt,
    });
    expect(reports.getCachedReportUrl).toHaveBeenCalledWith(4);
  });

  it('converts the route param to a number when submitting a round', () => {
    controller.submit('4');

    expect(service.submit).toHaveBeenCalledWith(4);
  });
});
