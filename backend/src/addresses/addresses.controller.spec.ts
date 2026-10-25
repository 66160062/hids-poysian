import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

describe('AddressesController', () => {
  let controller: AddressesController;
  let testingModule: TestingModule;
  let service: jest.Mocked<
    Pick<
      AddressesService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        { provide: AddressesService, useValue: serviceMock },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn((token: string) => {
              if (token === 'admin-token') return { sub: 1, role: 'admin' };
              if (token === 'link-token')
                return { project_id: 1, role: 'customer' };
              throw new Error('invalid token');
            }),
          },
        },
      ],
    }).compile();

    controller = testingModule.get<AddressesController>(AddressesController);
    service = testingModule.get(AddressesService);
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

  it('requires an admin token to read and edit addresses', async () => {
    service.findAll.mockResolvedValue([]);
    service.update.mockResolvedValue({
      raw: [],
      generatedMaps: [],
      affected: 1,
    });
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).get('/addresses').expect(401);
      await request(app.getHttpServer())
        .get('/addresses')
        .set('Authorization', 'Bearer link-token')
        .expect(403);
      await request(app.getHttpServer())
        .get('/addresses')
        .set('Authorization', 'Bearer admin-token')
        .expect(200, []);
      await request(app.getHttpServer())
        .patch('/addresses/7')
        .set('Authorization', 'Bearer link-token')
        .send({ district: 'Bang Rak' })
        .expect(403);
      await request(app.getHttpServer())
        .patch('/addresses/7')
        .set('Authorization', 'Bearer admin-token')
        .send({ district: 'Bang Rak' })
        .expect(200);
    } finally {
      await app.close();
    }
  });
});
