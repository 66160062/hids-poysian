import { PartialType } from '@nestjs/swagger';
import { CreateDefectsCategoryDto } from './create-defects-category.dto';

export class UpdateDefectsCategoryDto extends PartialType(
  CreateDefectsCategoryDto,
) {}
