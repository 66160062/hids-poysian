import { PartialType } from '@nestjs/swagger';
import { CreateInspectionJobDto } from './create-inspection-job.dto';

export class UpdateInspectionJobDto extends PartialType(
  CreateInspectionJobDto,
) {}
