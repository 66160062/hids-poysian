import { PartialType } from '@nestjs/swagger';
import { CreateHouseTypeDto } from './create-house-type.dto';

export class UpdateHouseTypeDto extends PartialType(CreateHouseTypeDto) {}
