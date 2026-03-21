import { PartialType } from '@nestjs/swagger';
import { CreateSummaryTemplateOptionDto } from './create-summary-template-option.dto';

export class UpdateSummaryTemplateOptionDto extends PartialType(
  CreateSummaryTemplateOptionDto,
) {}
