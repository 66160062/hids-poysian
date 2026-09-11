import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { User } from 'src/users/entities/user.entity';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    softDelete: jest.Mock;
  };
  let usersRepo: {
    update: jest.Mock;
  };

  beforeEach(async () => {
    teamsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      softDelete: jest.fn(),
    };
    usersRepo = {
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: teamsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('orders teams by team_Id descending and only returns active ones', async () => {
    await service.findAll();

    expect(teamsRepo.find).toHaveBeenCalledWith({
      where: { status: 'active' },
      order: { team_Id: 'DESC' },
    });
  });

  it('looks up a team using the team_Id column', async () => {
    teamsRepo.findOneByOrFail.mockResolvedValue({ team_Id: 8 });

    await expect(service.findOne(8)).resolves.toMatchObject({ team_Id: 8 });
    expect(teamsRepo.findOneByOrFail).toHaveBeenCalledWith({ team_Id: 8 });
  });

  it('merges the dto onto the loaded team before saving', async () => {
    teamsRepo.findOneByOrFail.mockResolvedValue({
      team_Id: 8,
      teamName: 'เดิม',
    });
    teamsRepo.save.mockImplementation((value) => value);

    await expect(
      service.update(8, { teamName: 'ใหม่' } as never),
    ).resolves.toMatchObject({ team_Id: 8, teamName: 'ใหม่' });
  });

  it('deactivates a team instead of deleting the row, and unassigns its members', async () => {
    teamsRepo.findOneByOrFail.mockResolvedValue({
      team_Id: 8,
      status: 'active',
    });
    teamsRepo.save.mockImplementation((value) => value);

    await expect(service.remove(8)).resolves.toMatchObject({
      team_Id: 8,
      status: 'inactive',
    });

    expect(teamsRepo.softDelete).not.toHaveBeenCalled();
    expect(usersRepo.update).toHaveBeenCalledWith(
      { teamId: 8 },
      { teamId: null },
    );
  });
});
