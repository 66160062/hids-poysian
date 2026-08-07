import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { StorageService } from 'src/storage/storage.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<Pick<UsersService, 'create' | 'update' | 'findOne'>>;
  let storage: jest.Mocked<Pick<StorageService, 'uploadImage'>>;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    const storageMock = { uploadImage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: serviceMock },
        { provide: StorageService, useValue: storageMock },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    storage = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads the avatar and forwards its url when a file is attached', async () => {
    storage.uploadImage.mockResolvedValue('https://example.com/users/avatar.jpg');
    const file = { buffer: Buffer.from('img'), size: 50 } as Express.Multer.File;

    await controller.create(file, { email: 'a@b.com' } as never);

    expect(storage.uploadImage).toHaveBeenCalledWith(file.buffer, 'users');
    expect(service.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      imageUrl: 'https://example.com/users/avatar.jpg',
    });
  });

  it('falls back to the default avatar when no file is attached', async () => {
    await controller.create(
      undefined as unknown as Express.Multer.File,
      { email: 'a@b.com' } as never,
    );

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      imageUrl: '/uploads/users/default-avatar.jpg',
    });
  });

  it('only overwrites imageUrl on update when a new file is attached', async () => {
    await controller.update(
      1,
      undefined as unknown as Express.Multer.File,
      { fullName: 'ใหม่' } as never,
    );

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.update).toHaveBeenCalledWith(1, { fullName: 'ใหม่' });
  });
});
