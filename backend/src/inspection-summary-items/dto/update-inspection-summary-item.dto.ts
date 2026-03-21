import { PartialType } from '@nestjs/swagger';
import { CreateInspectionSummaryItemDto } from './create-inspection-summary-item.dto';

export class UpdateInspectionSummaryItemDto extends PartialType(
  CreateInspectionSummaryItemDto,
) {}
