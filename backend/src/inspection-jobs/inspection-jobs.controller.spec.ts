import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { InspectionJobsController } from './inspection-jobs.controller';
import { InspectionJobsService } from './inspection-jobs.service';
import { AuthService } from 'src/auth/auth.service';
import { StorageService } from 'src/storage/storage.service';

describe('InspectionJobsController', () => {
  let controller: InspectionJobsController;
  let service: jest.Mocked<
    Pick<InspectionJobsService, 'create' | 'update' | 'findAll'>
  >;
  let storage: jest.Mocked<Pick<StorageService, 'uploadImage'>>;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    };
    const storageMock = { uploadImage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionJobsController],
      providers: [
        { provide: InspectionJobsService, useValue: serviceMock },
        { provide: AuthService, useValue: {} },
        { provide: StorageService, useValue: storageMock },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<InspectionJobsController>(
      InspectionJobsController,
    );
    service = module.get(InspectionJobsService);
    storage = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('falls back to placeholder image and empty house plan when no files are uploaded', async () => {
    await controller.create({}, { title: 'บ้านเดี่ยว' } as never);

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith({
      title: 'บ้านเดี่ยว',
      projectImageUrl: '/uploads/inspection_jobs/unknown.jpg',
      housePlanUrl: '',
    });
  });

  it('uploads both files and forwards their urls when attached', async () => {
    storage.uploadImage
      .mockResolvedValueOnce('https://example.com/project.jpg')
      .mockResolvedValueOnce('https://example.com/plan.jpg');
    const projectImageUrl = [{ buffer: Buffer.from('p') }] as Express.Multer.File[];
    const housePlanUrl = [{ buffer: Buffer.from('h') }] as Express.Multer.File[];

    await controller.create(
      { projectImageUrl, housePlanUrl },
      { title: 'บ้านเดี่ยว' } as never,
    );

    expect(service.create).toHaveBeenCalledWith({
      title: 'บ้านเดี่ยว',
      projectImageUrl: 'https://example.com/project.jpg',
      housePlanUrl: 'https://example.com/plan.jpg',
    });
  });

  it('treats the "all" status filter as no filter at all', () => {
    controller.findAll(1, 10, 'all', undefined, undefined, undefined, undefined);

    expect(service.findAll).toHaveBeenCalledWith(
      1,
      10,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('defaults page and limit when they are not numbers', () => {
    controller.findAll(
      undefined,
      undefined,
      'Active' as never,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(service.findAll).toHaveBeenCalledWith(
      1,
      10,
      'Active',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('only overwrites the house plan url when a new file is uploaded on update', async () => {
    await controller.update(
      '4',
      {},
      { housePlanUrl: 'https://example.com/old-plan.jpg' } as never,
    );

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(service.update).toHaveBeenCalledWith(4, {
      housePlanUrl: 'https://example.com/old-plan.jpg',
      projectImageUrl: undefined,
    });
  });
});
