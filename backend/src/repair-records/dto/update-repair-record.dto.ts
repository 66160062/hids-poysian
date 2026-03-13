import { PartialType } from '@nestjs/swagger';
import { CreateRepairRecordDto } from './create-repair-record.dto';

export class UpdateRepairRecordDto extends PartialType(CreateRepairRecordDto) {}
