import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: jest.Mocked<Pick<RoomsService, 'findOne' | 'remove' | 'create' | 'findAll' | 'update'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one room', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('passes the create dto straight through to the service', () => {
    const dto = { roomName: 'ห้องนอน' } as never;

    controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll(): should call service.findAll() without arguments', () => {
    controller.findAll();
    
    expect(service.findAll).toHaveBeenCalled();
  });

  it('update(): should call service.update() with correct parameters', () => {
    const id = '5';
    const dto = { roomName: 'ห้องครัว' } as never;

    controller.update(id, dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('remove(): should call service.remove() with correct parameter', () => {
    const id = '5';

    controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
