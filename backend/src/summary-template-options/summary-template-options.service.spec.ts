import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SummaryTemplateOptionsService } from './summary-template-options.service';
import { SummaryTemplateOption } from './entities/summary-template-option.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';

describe('SummaryTemplateOptionsService', () => {
  let service: SummaryTemplateOptionsService;
  let optionsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
    remove: jest.Mock;
  };
  let templatesRepo: { findOneByOrFail: jest.Mock };

  beforeEach(async () => {
    optionsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      remove: jest.fn(),
    };
    templatesRepo = { findOneByOrFail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryTemplateOptionsService,
        {
          provide: getRepositoryToken(SummaryTemplateOption),
          useValue: optionsRepo,
        },
        {
          provide: getRepositoryToken(SummaryTemplate),
          useValue: templatesRepo,
        },
      ],
    }).compile();

    service = module.get<SummaryTemplateOptionsService>(
      SummaryTemplateOptionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('attaches the parent template before saving a new option', async () => {
    templatesRepo.findOneByOrFail.mockResolvedValue({ templateId: 2 });
    optionsRepo.create.mockImplementation((value) => value);
    optionsRepo.save.mockImplementation((value) => value);

    const result = await service.create({
      templateId: 2,
      value: 'ดี',
    } as never);

    expect(templatesRepo.findOneByOrFail).toHaveBeenCalledWith({
      templateId: 2,
    });
    expect(result).toMatchObject({ value: 'ดี', template: { templateId: 2 } });
  });

  it('merges the dto onto the loaded option before saving', async () => {
    optionsRepo.findOneByOrFail.mockResolvedValue({
      optionId: 9,
      value: 'ดี',
    });
    optionsRepo.save.mockImplementation((value) => value);

    await expect(
      service.update(9, { value: 'แย่' } as never),
    ).resolves.toMatchObject({ optionId: 9, value: 'แย่' });
  });

  it('hard-removes an option once loaded', async () => {
    optionsRepo.findOneByOrFail.mockResolvedValue({ optionId: 9 });

    await service.remove(9);

    expect(optionsRepo.remove).toHaveBeenCalledWith({ optionId: 9 });
  });
});
