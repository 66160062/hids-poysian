import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
  let templatesRepo: { findOneByOrFail: jest.Mock };
  let optionsRepo: { findOneByOrFail: jest.Mock };

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
    templatesRepo = { findOneByOrFail: jest.fn() };
    optionsRepo = { findOneByOrFail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionSummaryItemsService,
        { provide: getRepositoryToken(InspectionSummaryItem), useValue: itemsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(SummaryTemplate), useValue: templatesRepo },
        { provide: getRepositoryToken(SummaryTemplateOption), useValue: optionsRepo },
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
    } as never);

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
    } as never);

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
    } as never);

    expect(result).toMatchObject({ round: { roundId: 1 } });
  });

  it('only re-resolves the option relation when optionId changes on update', async () => {
    itemsRepo.findOneByOrFail.mockResolvedValue({
      itemId: 4,
      option: { optionId: 1 },
      detailValue: 'เดิม',
    });
    itemsRepo.save.mockImplementation((value) => value);

    await service.update(4, { detailValue: 'ใหม่' } as never);

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
});
