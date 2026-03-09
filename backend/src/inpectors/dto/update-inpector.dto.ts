import { PartialType } from '@nestjs/mapped-types';
import { CreateInpectorDto } from './create-inpector.dto';

export class UpdateInpectorDto extends PartialType(CreateInpectorDto) {}
