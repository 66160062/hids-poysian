import { PartialType } from '@nestjs/swagger';
import { CreateInspectionRoundDto } from './create-inspection-round.dto';

export class UpdateInspectionRoundDto extends PartialType(
  CreateInspectionRoundDto,
) {}
