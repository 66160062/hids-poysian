import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, IsNull, Not } from 'typeorm';
import {
  InspectionSummaryItemsService,
  MAX_PHOTOS_PER_TEMPLATE,
} from './inspection-summary-items.service';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';
import { StorageService } from 'src/storage/storage.service';

describe('InspectionSummaryItemsService', () => {
  let service: InspectionSummaryItemsService;
  let itemsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
    findOneBy: jest.Mock;
    count: jest.Mock;
    remove: jest.Mock;
    delete: jest.Mock;
  };
  let storageService: { uploadImage: jest.Mock; deleteFile: jest.Mock };
  let roundsRepo: { findOneByOrFail: jest.Mock };
  let templatesRepo: { findOneByOrFail: jest.Mock; findBy: jest.Mock };
  let optionsRepo: { findOneByOrFail: jest.Mock; findBy: jest.Mock };
  let deleteQb: Record<'delete' | 'from' | 'where' | 'andWhere' | 'execute', jest.Mock>;
  let manager: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    itemsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
    storageService = { uploadImage: jest.fn(), deleteFile: jest.fn() };
    roundsRepo = { findOneByOrFail: jest.fn() };
    templatesRepo = { findOneByOrFail: jest.fn(), findBy: jest.fn() };
    optionsRepo = { findOneByOrFail: jest.fn(), findBy: jest.fn() };
    deleteQb = {
      delete: jest.fn(() => deleteQb),
      from: jest.fn(() => deleteQb),
      where: jest.fn(() => deleteQb),
      andWhere: jest.fn(() => deleteQb),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    manager = {
      createQueryBuilder: jest.fn(() => deleteQb),
      create: jest.fn((_entity, value) => value),
      save: jest.fn((value) => value),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: EntityManager) => unknown) =>
        cb(manager as unknown as EntityManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionSummaryItemsService,
        {
          provide: getRepositoryToken(InspectionSummaryItem),
          useValue: itemsRepo,
        },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        {
          provide: getRepositoryToken(SummaryTemplate),
          useValue: templatesRepo,
        },
        {
          provide: getRepositoryToken(SummaryTemplateOption),
          useValue: optionsRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<InspectionSummaryItemsService>(
      InspectionSummaryItemsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resolves round, template, and option relations before creating an item', async () => {
    roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
    templatesRepo.findOneByOrFail.mockResolvedValue({ templateId: 2 });
    optionsRepo.findOneByOrFail.mockResolvedValue({ optionId: 3 });
    itemsRepo.create.mockImplementation((value) => value);
    itemsRepo.save.mockImplementation((value) => value);

    const result = await service.create({
      roundId: 1,
      templateId: 2,
      optionId: 3,
      detailValue: 'ผ่าน',
    });

    expect(result).toMatchObject({
      round: { roundId: 1 },
      template: { templateId: 2 },
      option: { optionId: 3 },
      detailValue: 'ผ่าน',
    });
  });

  it('upsert returns the existing item without creating a duplicate', async () => {
    itemsRepo.findOne.mockResolvedValue({ itemId: 9 });

    const result = await service.upsert({
      roundId: 1,
      templateId: 2,
      optionId: 3,
    });

    expect(result).toEqual({ itemId: 9 });
    expect(itemsRepo.create).not.toHaveBeenCalled();
  });

  it('upsert creates a new item when none exists for the round/template/option', async () => {
    itemsRepo.findOne.mockResolvedValue(null);
    roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
    templatesRepo.findOneByOrFail.mockResolvedValue({ templateId: 2 });
    optionsRepo.findOneByOrFail.mockResolvedValue({ optionId: 3 });
    itemsRepo.create.mockImplementation((value) => value);
    itemsRepo.save.mockImplementation((value) => value);

    const result = await service.upsert({
      roundId: 1,
      templateId: 2,
      optionId: 3,
    });

    expect(result).toMatchObject({ round: { roundId: 1 } });
  });

  it('only re-resolves the option relation when optionId changes on update', async () => {
    itemsRepo.findOneByOrFail.mockResolvedValue({
      itemId: 4,
      option: { optionId: 1 },
      detailValue: 'เดิม',
    });
    itemsRepo.save.mockImplementation((value) => value);

    await service.update(4, { detailValue: 'ใหม่' });

    expect(optionsRepo.findOneByOrFail).not.toHaveBeenCalled();
    expect(itemsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ detailValue: 'ใหม่' }),
    );
  });

  describe('createPhotoItem', () => {
    const file = { buffer: Buffer.from('img') } as Express.Multer.File;
    const dto = { roundId: 1, templateId: 2 };

    beforeEach(() => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      templatesRepo.findOneByOrFail.mockResolvedValue({ templateId: 2 });
      itemsRepo.create.mockImplementation((value) => value);
      itemsRepo.save.mockImplementation((value) => value);
    });

    it('stores the uploaded URL in photoUrl without linking an option', async () => {
      itemsRepo.count.mockResolvedValue(0);
      storageService.uploadImage.mockResolvedValue('https://cdn/photo.webp');

      const result = await service.createPhotoItem(file, dto);

      expect(result).toMatchObject({ photoUrl: 'https://cdn/photo.webp' });
      expect(result).not.toHaveProperty('detailValue');
      expect(result).not.toHaveProperty('option');
      expect(optionsRepo.findOneByOrFail).not.toHaveBeenCalled();
    });

    it('counts existing photos of the template by photoUrl', async () => {
      itemsRepo.count.mockResolvedValue(0);
      storageService.uploadImage.mockResolvedValue('https://cdn/photo.webp');

      await service.createPhotoItem(file, dto);

      expect(itemsRepo.count).toHaveBeenCalledWith({
        where: {
          round: { roundId: 1 },
          template: { templateId: 2 },
          photoUrl: Not(IsNull()),
        },
      });
    });

    it('rejects a photo past the per-template limit without uploading', async () => {
      itemsRepo.count.mockResolvedValue(MAX_PHOTOS_PER_TEMPLATE);

      await expect(service.createPhotoItem(file, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(storageService.uploadImage).not.toHaveBeenCalled();
      expect(itemsRepo.save).not.toHaveBeenCalled();
    });
  });

  it('remove deletes the stored photo file by photoUrl', async () => {
    const item = { itemId: 5, photoUrl: 'https://cdn/photo.webp' };
    itemsRepo.findOneByOrFail.mockResolvedValue(item);

    await service.remove(5);

    expect(storageService.deleteFile).toHaveBeenCalledWith(
      'https://cdn/photo.webp',
    );
    expect(itemsRepo.remove).toHaveBeenCalledWith(item);
  });

  it('deletes all items for a round when it has no photo items', async () => {
    itemsRepo.find.mockResolvedValue([]);

    await service.deleteByRound(7);

    expect(itemsRepo.delete).toHaveBeenCalledWith({ round: { roundId: 7 } });
  });

  it('deletes items scoped to a round and template', async () => {
    await service.deleteByRoundAndTemplate(7, 2);

    expect(itemsRepo.delete).toHaveBeenCalledWith({
      round: { roundId: 7 },
      template: { templateId: 2 },
    });
  });

  describe('replaceForRound', () => {
    beforeEach(() => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 7 });
      templatesRepo.findBy.mockResolvedValue([
        { templateId: 1 },
        { templateId: 2 },
      ]);
      optionsRepo.findBy.mockResolvedValue([
        { optionId: 10 },
        { optionId: 20 },
        { optionId: 30 },
      ]);
    });

    it('loads every template and option in one batched query each', async () => {
      await service.replaceForRound(7, [
        { templateId: 1, optionId: 10 },
        { templateId: 1, optionId: 20 },
        { templateId: 2, optionId: 30, detailValue: 'หมายเหตุ' },
      ]);

      expect(templatesRepo.findBy).toHaveBeenCalledTimes(1);
      expect(optionsRepo.findBy).toHaveBeenCalledTimes(1);
    });

    it('deletes existing items and saves the new set in one transaction', async () => {
      const result = await service.replaceForRound(7, [
        { templateId: 1, optionId: 10 },
        { templateId: 2, optionId: 30, detailValue: 'หมายเหตุ' },
      ]);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(deleteQb.from).toHaveBeenCalledWith(InspectionSummaryItem);
      expect(deleteQb.where).toHaveBeenCalledWith('round_id = :roundId', {
        roundId: 7,
      });
      // แถวรูปต้องรอด ไม่งั้น autosave คำตอบทุกครั้งจะลบรูปทิ้ง
      expect(deleteQb.andWhere).toHaveBeenCalledWith('photo_url IS NULL');
      expect(deleteQb.execute).toHaveBeenCalledTimes(1);
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        expect.objectContaining({
          round: { roundId: 7 },
          template: { templateId: 1 },
          option: { optionId: 10 },
          detailValue: '',
        }),
        expect.objectContaining({
          template: { templateId: 2 },
          option: { optionId: 30 },
          detailValue: 'หมายเหตุ',
        }),
      ]);
    });

    it('clears the round without saving when the item list is empty', async () => {
      const result = await service.replaceForRound(7, []);

      expect(deleteQb.execute).toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('rejects the whole batch before touching the transaction when an id is unknown', async () => {
      await expect(
        service.replaceForRound(7, [{ templateId: 1, optionId: 999 }]),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
