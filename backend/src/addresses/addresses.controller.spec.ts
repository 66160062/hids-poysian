import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: jest.Mocked<
    Pick<AddressesService, 'create' | 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
    service = module.get(AddressesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one address', () => {
    controller.findOne('7');

    expect(service.findOne).toHaveBeenCalledWith(7);
  });

  it('converts the route param to a number when updating an address', () => {
    controller.update('7', { district: 'บางรัก' });

    expect(service.update).toHaveBeenCalledWith(7, { district: 'บางรัก' });
  });

  it('converts the route param to a number when removing an address', () => {
    controller.remove('7');

    expect(service.remove).toHaveBeenCalledWith(7);
  });
});
