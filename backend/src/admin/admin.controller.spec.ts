import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<
    Pick<AdminService, 'getDashboardData' | 'syncJobStatuses' | 'getAllWorkList'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      getDashboardData: jest.fn(),
      syncJobStatuses: jest.fn(),
      getAllWorkList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the date query param when loading the dashboard', () => {
    controller.getDashboard('2026-08-01');

    expect(service.getDashboardData).toHaveBeenCalledWith('2026-08-01');
  });

  it('delegates work list retrieval to the service', () => {
    controller.getWorkList();

    expect(service.getAllWorkList).toHaveBeenCalled();
  });
});
