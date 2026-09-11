import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubRoomsService } from './sub-rooms.service';
import { SubRoom } from './entities/sub-room.entity';

describe('SubRoomsService', () => {
  let service: SubRoomsService;
  let subRoomsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    subRoomsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubRoomsService,
        { provide: getRepositoryToken(SubRoom), useValue: subRoomsRepo },
      ],
    }).compile();

    service = module.get<SubRoomsService>(SubRoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates a sub-room by its raw id', async () => {
    await service.update(6, { subRoomName: 'ห้องน้ำในตัว' } as never);

    expect(subRoomsRepo.update).toHaveBeenCalledWith(6, {
      subRoomName: 'ห้องน้ำในตัว',
    });
  });

  it('soft-deletes a sub-room by wrapping the id in a where clause', async () => {
    await service.remove(6);

    expect(subRoomsRepo.softDelete).toHaveBeenCalledWith({ subRoomId: 6 });
  });
});
