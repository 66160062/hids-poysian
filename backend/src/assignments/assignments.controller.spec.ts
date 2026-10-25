import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { JwtService } from '@nestjs/jwt';
import { jwtServiceMock } from 'src/auth/testing/jwt-service.mock';
import request from 'supertest';

describe('AssignmentsController', () => {
  let testingModule: TestingModule;
  let controller: AssignmentsController;
  let service: jest.Mocked<
    Pick<AssignmentsService, 'findByJob' | 'findByProject' | 'remove'>
  >;

  beforeEach(async () => {
    const serviceMock = {
      findByJob: jest.fn(),
      findByProject: jest.fn(),
      remove: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        { provide: AssignmentsService, useValue: serviceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = testingModule.get<AssignmentsController>(
      AssignmentsController,
    );
    service = testingModule.get(AssignmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the parsed job id when listing assignments by job', () => {
    controller.findByJob(3);

    expect(service.findByJob).toHaveBeenCalledWith(3);
  });

  it('forwards the parsed id when removing an assignment', () => {
    controller.remove(5);

    expect(service.remove).toHaveBeenCalledWith(5);
  });

  it('rejects requests without a token or with a non-admin token', async () => {
    const app = testingModule.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).get('/assignments/job/1').expect(401);
      await request(app.getHttpServer())
        .get('/assignments/job/1')
        .set('Authorization', 'Bearer link-token')
        .expect(403);
      await request(app.getHttpServer())
        .get('/assignments/job/1')
        .set('Authorization', 'Bearer inspector-token')
        .expect(403);
    } finally {
      await app.close();
    }
  });
});
