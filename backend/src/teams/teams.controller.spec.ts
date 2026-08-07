import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { StorageService } from 'src/storage/storage.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: jest.Mocked<Pick<TeamsService, 'create' | 'findOne'>>;
  let storage: jest.Mocked<Pick<StorageService, 'uploadImage'>>;

  beforeEach(async () => {
    const serviceMock = { create: jest.fn(), findOne: jest.fn() };
    const storageMock = { uploadImage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        { provide: TeamsService, useValue: serviceMock },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get(TeamsService);
    storage = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads the logo and forwards its url when a file is attached', async () => {
    storage.uploadImage.mockResolvedValue('https://example.com/teams/logo.jpg');
    const file = { buffer: Buffer.from('logo'), size: 111 } as Express.Multer.File;

    await controller.create(file, { teamName: 'ทีม A' } as never);

    expect(storage.uploadImage).toHaveBeenCalledWith(file.buffer, 'teams');
    expect(service.create).toHaveBeenCalledWith({
      teamName: 'ทีม A',
      logo_url: 'https://example.com/teams/logo.jpg',
    });
  });

  it('sends a null logo_url when no file is attached', async () => {
    await controller.create(
      undefined as unknown as Express.Multer.File,
      { teamName: 'ทีม B' } as never,
    );

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith({
      teamName: 'ทีม B',
      logo_url: null,
    });
  });

  it('converts the route param to a number when looking up one team', () => {
    controller.findOne('8');

    expect(service.findOne).toHaveBeenCalledWith(8);
  });
});
