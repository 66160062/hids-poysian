import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HouseTypesService } from './house-types.service';
import { HouseType } from './entities/house-type.entity';

describe('HouseTypesService', () => {
  let service: HouseTypesService;
  let houseTypesRepo: {
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    houseTypesRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseTypesService,
        { provide: getRepositoryToken(HouseType), useValue: houseTypesRepo },
      ],
    }).compile();

    service = module.get<HouseTypesService>(HouseTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('looks up a house type using the snake_case column name', async () => {
    houseTypesRepo.findOneByOrFail.mockResolvedValue({ house_type_id: 3 });

    await expect(service.findOne(3)).resolves.toMatchObject({
      house_type_id: 3,
    });
    expect(houseTypesRepo.findOneByOrFail).toHaveBeenCalledWith({
      house_type_id: 3,
    });
  });

  it('updates a house type by its raw id, not a where clause', async () => {
    await service.update(3, { typeName: 'บ้านเดี่ยว' } as never);

    expect(houseTypesRepo.update).toHaveBeenCalledWith(3, {
      typeName: 'บ้านเดี่ยว',
    });
  });
});
