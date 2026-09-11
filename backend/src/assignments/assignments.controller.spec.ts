import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: jest.Mocked<
    Pick<AssignmentsService, 'findByJob' | 'findByProject' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findByJob: jest.fn(),
      findByProject: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [{ provide: AssignmentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    service = module.get(AssignmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the parsed job id when listing assignments by job', () => {
    controller.findByJob(3);

    expect(service.findByJob).toHaveBeenCalledWith(3);
  });

  it('forwards the parsed id when removing an assignment', () => {
    controller.remove(5);

    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
