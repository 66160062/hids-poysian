import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import request from 'supertest';

describe('CustomersController', () => {
  let controller: CustomersController;
  let testingModule: TestingModule;
  let service: jest.Mocked<
    Pick<CustomersService, 'findAll' | 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CustomersService, useValue: serviceMock },
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

    controller = testingModule.get<CustomersController>(CustomersController);
    service = testingModule.get(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one customer', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('converts the route param to a number when removing a customer', () => {
    controller.remove('4');

    expect(service.remove).toHaveBeenCalledWith(4);
  });

  it('requires an admin token to list customers', async () => {
    service.findAll.mockResolvedValue([]);
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).get('/customers').expect(401);
      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer link-token')
        .expect(403);
      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer admin-token')
        .expect(200, []);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
