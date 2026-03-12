import { PartialType } from '@nestjs/swagger';
import { CreateDefectDto } from './create-defect.dto';

export class UpdateDefectDto extends PartialType(CreateDefectDto) {}
