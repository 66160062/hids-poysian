import { PartialType } from '@nestjs/swagger';
import { CreateDefectSubCategoryDto } from './create-defect-sub-category.dto';

export class UpdateDefectSubCategoryDto extends PartialType(
  CreateDefectSubCategoryDto,
) {}
