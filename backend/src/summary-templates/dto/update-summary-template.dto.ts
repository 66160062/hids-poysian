import { PartialType } from '@nestjs/swagger';
import { CreateSummaryTemplateDto } from './create-summary-template.dto';

export class UpdateSummaryTemplateDto extends PartialType(CreateSummaryTemplateDto) {}
