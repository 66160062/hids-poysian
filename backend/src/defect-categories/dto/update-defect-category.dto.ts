import { PartialType } from '@nestjs/swagger';
import { CreateDefectCategoryDto } from './create-defect-category.dto';

export class UpdateDefectCategoryDto extends PartialType(
  CreateDefectCategoryDto,
) {}
