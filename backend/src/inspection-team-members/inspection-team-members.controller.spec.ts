import { Test, TestingModule } from '@nestjs/testing';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { InspectionTeamMembersService } from './inspection-team-members.service';

describe('InspectionTeamMembersController', () => {
  let controller: InspectionTeamMembersController;
  let service: jest.Mocked<
    Pick<InspectionTeamMembersService, 'findByJob' | 'findByProject' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findByJob: jest.fn(),
      findByProject: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionTeamMembersController],
      providers: [
        { provide: InspectionTeamMembersService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<InspectionTeamMembersController>(
      InspectionTeamMembersController,
    );
    service = module.get(InspectionTeamMembersService);
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
