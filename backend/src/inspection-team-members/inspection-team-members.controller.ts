import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { CreateInspectionTeamMemberDto } from './dto/create-inspection-team-member.dto';
import { UpdateInspectionTeamMemberDto } from './dto/update-inspection-team-member.dto';

@Controller('inspection-team-members')
export class InspectionTeamMembersController {
  constructor(
    private readonly inspectionTeamMembersService: InspectionTeamMembersService,
  ) {}

  @Post()
  create(@Body() createInspectionTeamMemberDto: CreateInspectionTeamMemberDto) {
    return this.inspectionTeamMembersService.create(
      createInspectionTeamMemberDto,
    );
  }

  @Get()
  findAll() {
    return this.inspectionTeamMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionTeamMembersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionTeamMemberDto: UpdateInspectionTeamMemberDto,
  ) {
    return this.inspectionTeamMembersService.update(
      +id,
      updateInspectionTeamMemberDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionTeamMembersService.remove(+id);
  }
}
