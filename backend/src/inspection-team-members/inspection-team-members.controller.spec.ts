import { Test, TestingModule } from '@nestjs/testing';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { InspectionTeamMembersService } from './inspection-team-members.service';

describe('InspectionTeamMembersController', () => {
  let controller: InspectionTeamMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionTeamMembersController],
      providers: [InspectionTeamMembersService],
    }).compile();

    controller = module.get<InspectionTeamMembersController>(InspectionTeamMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
