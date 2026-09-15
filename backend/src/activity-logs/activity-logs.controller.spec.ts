import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { AuthService } from 'src/auth/auth.service';

describe('ActivityLogsController', () => {
  let controller: ActivityLogsController;
  let serviceMock: jest.Mocked<Pick<ActivityLogsService, 'findByJob'>>;

  beforeEach(async () => {
    serviceMock = { findByJob: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogsController],
      providers: [
        { provide: ActivityLogsService, useValue: serviceMock },
        { provide: AuthService, useValue: { verifyJobAccess: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ActivityLogsController>(ActivityLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the parsed jobId to the service', () => {
    controller.findByJob(12);

    expect(serviceMock.findByJob).toHaveBeenCalledWith(12);
  });
});
