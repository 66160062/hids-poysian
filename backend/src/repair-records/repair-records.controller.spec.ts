import { Test, TestingModule } from '@nestjs/testing';
import { RepairRecordsController } from './repair-records.controller';
import { RepairRecordsService } from './repair-records.service';
import { StorageService } from 'src/storage/storage.service';

describe('RepairRecordsController', () => {
  let controller: RepairRecordsController;
  let service: jest.Mocked<Pick<RepairRecordsService, 'create' | 'update'>>;
  let storage: jest.Mocked<Pick<StorageService, 'uploadImage'>>;

  beforeEach(async () => {
    const serviceMock = { create: jest.fn(), update: jest.fn() };
    const storageMock = { uploadImage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairRecordsController],
      providers: [
        { provide: RepairRecordsService, useValue: serviceMock },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    controller = module.get<RepairRecordsController>(RepairRecordsController);
    service = module.get(RepairRecordsService);
    storage = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads the image and forwards its url and size when a file is attached', async () => {
    storage.uploadImage.mockResolvedValue(
      'https://example.com/repair_records/mock.jpg',
    );
    const file = { buffer: Buffer.from('img'), size: 999 } as Express.Multer.File;

    await controller.create(file, { note: 'ซ่อมแล้ว' } as never);

    expect(storage.uploadImage).toHaveBeenCalledWith(
      file.buffer,
      'repair_records',
    );
    expect(service.create).toHaveBeenCalledWith({
      note: 'ซ่อมแล้ว',
      imageUrl: 'https://example.com/repair_records/mock.jpg',
      fileSize: 999,
    });
  });

  it('falls back to the default image and zero size when no file is attached', async () => {
    await controller.create(
      undefined as unknown as Express.Multer.File,
      { note: 'ไม่มีรูป' } as never,
    );

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith({
      note: 'ไม่มีรูป',
      imageUrl: '/uploads/repair_records/default.jpg',
      fileSize: 0,
    });
  });
});
