import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { InspectionJob } from './entities/inspection-job.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';
import { DataSource } from 'typeorm';

describe('InspectionJobsService', () => {
  let service: InspectionJobsService;
  let inspectionsRepo: {
    findOneBy: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    inspectionsRepo = {
      findOneBy: jest.fn(),
      softDelete: jest.fn(),
    };
    const repoMock = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionJobsService,
        { provide: getRepositoryToken(InspectionJob), useValue: inspectionsRepo },
        { provide: getRepositoryToken(Customer), useValue: repoMock },
        { provide: getRepositoryToken(Address), useValue: repoMock },
        { provide: getRepositoryToken(HouseType), useValue: repoMock },
        { provide: getRepositoryToken(Contractor), useValue: repoMock },
        { provide: DataSource, useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get<InspectionJobsService>(InspectionJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject updates for locked jobs', async () => {
    inspectionsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      status: 'Locked',
    });

    await expect(
      service.update(12, { projectName: 'Updated' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject deletes for locked jobs', async () => {
    inspectionsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      status: 'Locked',
    });

    await expect(service.remove(12)).rejects.toBeInstanceOf(ForbiddenException);
    expect(inspectionsRepo.softDelete).not.toHaveBeenCalled();
  });
});
