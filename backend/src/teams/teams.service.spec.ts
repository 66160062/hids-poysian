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
    findOneOrFail: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let usersRepo: {
    update: jest.Mock;
  };
  let qb: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
    getCount: jest.Mock;
  };

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest
        .fn()
        .mockResolvedValue([{ team_Id: 1, team_name: 'Team A' }]),
      getCount: jest.fn().mockResolvedValue(1),
    };

    teamsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      findOneOrFail: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
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
    const result = await service.findAll();

    expect(teamsRepo.createQueryBuilder).toHaveBeenCalledWith('team');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('team.branch', 'branch');
    expect(qb.where).toHaveBeenCalledWith('team.status = :status', {
      status: 'active',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('team.team_Id', 'DESC');
    expect(result.data).toHaveLength(1);
  });

  it('looks up a team using the team_Id column, including its branch', async () => {
    teamsRepo.findOneOrFail.mockResolvedValue({ team_Id: 8 });

    await expect(service.findOne(8)).resolves.toMatchObject({ team_Id: 8 });
    expect(teamsRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { team_Id: 8 },
      relations: ['branch'],
    });
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

  it('treats branchId: 0 as a sentinel to unassign the branch', async () => {
    teamsRepo.findOneByOrFail.mockResolvedValue({
      team_Id: 8,
      branchId: 3,
    });
    teamsRepo.save.mockImplementation((value) => value);

    await expect(
      service.update(8, { branchId: 0 } as never),
    ).resolves.toMatchObject({ team_Id: 8, branchId: null });
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
