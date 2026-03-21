import { PartialType } from '@nestjs/swagger';
import { CreateInspectionTeamMemberDto } from './create-inspection-team-member.dto';

export class UpdateInspectionTeamMemberDto extends PartialType(
  CreateInspectionTeamMemberDto,
) {}
