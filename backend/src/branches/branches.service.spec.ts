import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { StorageService } from 'src/storage/storage.service';
import { CreateBranchDto } from './dto/create-branch.dto';

describe('BranchesService', () => {
  let service: BranchesService;
  let repo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let storage: { uploadImage: jest.Mock; deleteFile: jest.Mock };
  const logo = { buffer: Buffer.from('img') } as Express.Multer.File;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((value: Partial<Branch>) => ({ ...value })),
      save: jest.fn((value: Partial<Branch>) => Promise.resolve(value)),
    };
    storage = {
      uploadImage: jest.fn().mockResolvedValue('https://cdn/new-logo.webp'),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: getRepositoryToken(Branch), useValue: repo },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(BranchesService);
  });

  describe('create', () => {
    it('ignores fields that are not part of the DTO', async () => {
      // ValidationPipe ไม่ได้ตัด field แปลกปลอม — body แบบนี้ผ่านเข้ามาถึง service ได้จริง
      const body = {
        branchName: 'สาขาใหม่',
        branchId: 1,
        logoUrl: 'https://evil/x.png',
        deletedAt: new Date(),
      } as unknown as CreateBranchDto;

      await service.create(body);

      const [[saved]] = repo.save.mock.calls as [[Partial<Branch>]];
      expect(saved.branchName).toBe('สาขาใหม่');
      expect(saved.branchId).toBeUndefined();
      expect(saved.logoUrl).toBeUndefined();
      expect(saved.deletedAt).toBeUndefined();
    });

    it('uploads the logo and stores its URL', async () => {
      await service.create({ branchName: 'สาขาใหม่' }, logo);

      expect(storage.uploadImage).toHaveBeenCalledWith(logo.buffer, 'branches');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://cdn/new-logo.webp' }),
      );
    });
  });

  describe('update', () => {
    const existing = (): Branch =>
      ({
        branchId: 3,
        branchName: 'เดิม',
        phoneNumber: '0812345678',
        logoUrl: 'https://cdn/old-logo.webp',
        status: 'active',
      }) as Branch;

    it('only changes fields that were sent', async () => {
      repo.findOneBy.mockResolvedValue(existing());

      await service.update(3, { branchName: 'ชื่อใหม่' });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 3,
          branchName: 'ชื่อใหม่',
          phoneNumber: '0812345678',
          logoUrl: 'https://cdn/old-logo.webp',
        }),
      );
    });

    it('cannot change branchId through the body', async () => {
      repo.findOneBy.mockResolvedValue(existing());

      await service.update(3, { branchId: 1 } as never);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 3 }),
      );
    });

    it('deletes the old logo only after the new one is saved', async () => {
      repo.findOneBy.mockResolvedValue(existing());

      await service.update(3, {}, logo);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://cdn/new-logo.webp' }),
      );
      expect(storage.deleteFile).toHaveBeenCalledWith(
        'https://cdn/old-logo.webp',
      );
      expect(repo.save.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteFile.mock.invocationCallOrder[0],
      );
    });

    it('keeps the old logo when saving fails', async () => {
      repo.findOneBy.mockResolvedValue(existing());
      repo.save.mockRejectedValue(new Error('db down'));

      await expect(service.update(3, {}, logo)).rejects.toThrow('db down');
      expect(storage.deleteFile).not.toHaveBeenCalled();
    });

    it('does not upload anything when the branch does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update(99, {}, logo)).rejects.toThrow(
        NotFoundException,
      );
      expect(storage.uploadImage).not.toHaveBeenCalled();
    });
  });

  it('remove marks the branch inactive instead of deleting it', async () => {
    repo.findOneBy.mockResolvedValue({ branchId: 3, status: 'active' });

    await service.remove(3);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'inactive' }),
    );
  });
});
