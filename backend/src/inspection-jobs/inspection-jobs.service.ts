import { Injectable } from '@nestjs/common';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';

@Injectable()
export class InspectionJobsService {
  create(createInspectionJobDto: CreateInspectionJobDto) {
    return 'This action adds a new inspectionJob';
  }

  findAll() {
    return `This action returns all inspectionJobs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inspectionJob`;
  }

  update(id: number, updateInspectionJobDto: UpdateInspectionJobDto) {
    return `This action updates a #${id} inspectionJob`;
  }

  remove(id: number) {
    return `This action removes a #${id} inspectionJob`;
  }
}
