import { Test, TestingModule } from '@nestjs/testing';
import { FloorController } from './floor.controller';
import { FloorService } from './floor.service';
import { JwtService } from '@nestjs/jwt';
import { jwtServiceMock } from 'src/auth/testing/jwt-service.mock';
import request from 'supertest';

describe('FloorController', () => {
  let testingModule: TestingModule;
  let controller: FloorController;
  let service: jest.Mocked<
    Pick<FloorService, 'findAll' | 'findOne' | 'remove' | 'create'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      controllers: [FloorController],
      providers: [
        { provide: FloorService, useValue: serviceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = testingModule.get<FloorController>(FloorController);
    service = testingModule.get(FloorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one floor', () => {
    controller.findOne('2');

    expect(service.findOne).toHaveBeenCalledWith(2);
  });

  it('requires a staff token to list floors', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).get('/floor').expect(401);
      await request(app.getHttpServer())
        .get('/floor')
        .set('Authorization', 'Bearer inspector-token')
        .expect(200, []);
    } finally {
      await app.close();
    }
  });

  it('only lets admins create floors', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).post('/floor').expect(401);
      await request(app.getHttpServer())
        .post('/floor')
        .set('Authorization', 'Bearer inspector-token')
        .expect(403);
      expect(service.create).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
