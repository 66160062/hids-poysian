import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';

describe('AddressesService', () => {
  let service: AddressesService;
  let addressesRepo: {
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    addressesRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: getRepositoryToken(Address), useValue: addressesRepo },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saves a new address', async () => {
    const dto = {
      houseNumber: '123',
      floor: '2',
      soi: 'สุขุมวิท 11',
      subDistrict: 'คลองเตยเหนือ',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
    };
    addressesRepo.save.mockResolvedValue({ addressId: 1, ...dto });

    await expect(service.create(dto)).resolves.toMatchObject({
      addressId: 1,
      houseNumber: '123',
    });
    expect(addressesRepo.save).toHaveBeenCalledWith(dto);
  });

  it('looks up an address by id and throws when missing', async () => {
    addressesRepo.findOneByOrFail.mockResolvedValue({ addressId: 7 });

    await expect(service.findOne(7)).resolves.toMatchObject({ addressId: 7 });
    expect(addressesRepo.findOneByOrFail).toHaveBeenCalledWith({
      addressId: 7,
    });

    addressesRepo.findOneByOrFail.mockRejectedValue(new Error('not found'));
    await expect(service.findOne(999)).rejects.toThrow('not found');
  });

  it('updates an address by id', async () => {
    addressesRepo.update.mockResolvedValue({ affected: 1 });

    await service.update(7, { district: 'บางรัก' });

    expect(addressesRepo.update).toHaveBeenCalledWith(
      { addressId: 7 },
      { district: 'บางรัก' },
    );
  });

  it('soft-deletes an address by id', async () => {
    addressesRepo.softDelete.mockResolvedValue({ affected: 1 });

    await service.remove(7);

    expect(addressesRepo.softDelete).toHaveBeenCalledWith(7);
  });
});
