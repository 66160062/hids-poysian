import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    roomsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: roomsRepo },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('orders rooms by roomId ascending', async () => {
    await service.findAll();

    expect(roomsRepo.find).toHaveBeenCalledWith({
      order: { roomId: 'ASC' },
    });
  });

  it('merges the dto onto the loaded room before saving', async () => {
    roomsRepo.findOneByOrFail.mockResolvedValue({
      roomId: 3,
      roomName: 'ห้องนอน',
    });
    roomsRepo.save.mockImplementation((value) => value);

    await expect(
      service.update(3, { roomName: 'ห้องครัว' } as never),
    ).resolves.toMatchObject({ roomId: 3, roomName: 'ห้องครัว' });
  });

  it('loads the room before removing it', async () => {
    roomsRepo.findOneByOrFail.mockResolvedValue({ roomId: 3 });

    await service.remove(3);

    expect(roomsRepo.remove).toHaveBeenCalledWith({ roomId: 3 });
  });
});
