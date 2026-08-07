import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SummaryTemplatesService } from './summary-templates.service';
import { SummaryTemplate } from './entities/summary-template.entity';

describe('SummaryTemplatesService', () => {
  let service: SummaryTemplatesService;
  let templatesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    templatesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryTemplatesService,
        {
          provide: getRepositoryToken(SummaryTemplate),
          useValue: templatesRepo,
        },
      ],
    }).compile();

    service = module.get<SummaryTemplatesService>(SummaryTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('loads relations when finding all templates', async () => {
    await service.findAll();

    expect(templatesRepo.find).toHaveBeenCalledWith({
      relations: ['options'],
    });
  });

  it('merges the dto onto the loaded template before saving', async () => {
    templatesRepo.findOneByOrFail.mockResolvedValue({
      templateId: 4,
      title: 'เดิม',
    });
    templatesRepo.save.mockImplementation((value) => value);

    await expect(
      service.update(4, { title: 'ใหม่' } as never),
    ).resolves.toMatchObject({ templateId: 4, title: 'ใหม่' });
  });

  it('hard-removes a template once loaded', async () => {
    templatesRepo.findOneByOrFail.mockResolvedValue({ templateId: 4 });

    await service.remove(4);

    expect(templatesRepo.remove).toHaveBeenCalledWith({ templateId: 4 });
  });
});
