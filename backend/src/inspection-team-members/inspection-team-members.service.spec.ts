import { Test, TestingModule } from '@nestjs/testing';
import { InspectionTeamMembersService } from './inspection-team-members.service';

describe('InspectionTeamMembersService', () => {
  let service: InspectionTeamMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionTeamMembersService],
    }).compile();

    service = module.get<InspectionTeamMembersService>(InspectionTeamMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
