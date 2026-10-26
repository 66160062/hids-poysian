import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { SummaryTemplatesController } from './summary-templates.controller';
import { SummaryTemplatesService } from './summary-templates.service';
import { jwtServiceMock } from 'src/auth/testing/jwt-service.mock';
import request from 'supertest';

describe('SummaryTemplatesController', () => {
  let controller: SummaryTemplatesController;
  let testingModule: TestingModule;
  let service: jest.Mocked<
    Pick<SummaryTemplatesService, 'findAll' | 'findOne' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      controllers: [SummaryTemplatesController],
      providers: [
        { provide: SummaryTemplatesService, useValue: serviceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = testingModule.get<SummaryTemplatesController>(
      SummaryTemplatesController,
    );
    service = testingModule.get(SummaryTemplatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one template', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  // หน้ารายงานของลูกค้าที่เข้าผ่านลิงก์ (ไม่มี Bearer token) ต้องดึงแม่แบบนี้ได้
  it('lets anyone, including link users without a login, list the templates', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer())
        .get('/summary-templates')
        .expect(200, []);
    } finally {
      await app.close();
    }
  });

  it('still requires a login to read one template and an admin to change them', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer())
        .get('/summary-templates/1')
        .expect(401);
      await request(app.getHttpServer()).post('/summary-templates').expect(401);
      await request(app.getHttpServer())
        .delete('/summary-templates/1')
        .set('Authorization', 'Bearer inspector-token')
        .expect(403);
    } finally {
      await app.close();
    }
  });
});
