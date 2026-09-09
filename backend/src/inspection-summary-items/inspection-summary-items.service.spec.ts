import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';

describe('InspectionSummaryItemsService', () => {
  let service: InspectionSummaryItemsService;
  let itemsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
    remove: jest.Mock;
    delete: jest.Mock;
  };
  let roundsRepo: { findOneByOrFail: jest.Mock };
  let templatesRepo: { findOneByOrFail: jest.Mock; findBy: jest.Mock };
  let optionsRepo: { findOneByOrFail: jest.Mock; findBy: jest.Mock };
  let manager: { delete: jest.Mock; create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    itemsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
    roundsRepo = { findOneByOrFail: jest.fn() };
    templatesRepo = { findOneByOrFail: jest.fn(), findBy: jest.fn() };
    optionsRepo = { findOneByOrFail: jest.fn(), findBy: jest.fn() };
    manager = {
      delete: jest.fn(),
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

  it('deletes all items for a round', async () => {
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
      expect(manager.delete).toHaveBeenCalledWith(InspectionSummaryItem, {
        round: { roundId: 7 },
      });
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

      expect(manager.delete).toHaveBeenCalled();
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
