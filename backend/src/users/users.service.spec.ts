import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };

  beforeEach(async () => {
    usersRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes the password before creating a user', async () => {
    usersRepo.create.mockImplementation((value) => value);
    usersRepo.save.mockImplementation((value) => value);

    const result = await service.create({
      email: 'a@b.com',
      password: 'plain-text',
    } as never);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-text', 10);
    expect(result).toMatchObject({ password: 'hashed-password' });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('hashes a new password on update but leaves it out when not provided', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 1, role: 'inspector' });
    usersRepo.save.mockImplementation((value) => value);

    const result = await service.update(1, {
      password: 'new-pass',
    } as never);

    expect(bcrypt.hash).toHaveBeenCalledWith('new-pass', 10);
    expect(result).toMatchObject({ password: 'hashed-password' });
  });

  it('clears teamId when a user is promoted to admin', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 1, role: 'inspector', teamId: 5 });
    usersRepo.save.mockImplementation((value) => value);

    const result = await service.update(1, { role: 'admin' } as never);

    expect(result).toMatchObject({ role: 'admin', teamId: null });
  });

  it('soft-removes a user after loading it', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 1 });

    await service.remove(1);

    expect(usersRepo.softRemove).toHaveBeenCalledWith({ id: 1 });
  });
});
