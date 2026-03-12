import { PartialType } from '@nestjs/swagger';
import { CreateDefectsSubCategoryDto } from './create-defects-sub-category.dto';

export class UpdateDefectsSubCategoryDto extends PartialType(CreateDefectsSubCategoryDto) {}
