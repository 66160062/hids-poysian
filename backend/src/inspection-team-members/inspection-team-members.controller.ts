import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { CreateInspectionTeamMemberDto } from './dto/create-inspection-team-member.dto';

@ApiTags('assignments')
@Controller('assignments')
export class InspectionTeamMembersController {
  constructor(
    private readonly inspectionTeamMembersService: InspectionTeamMembersService,
  ) {}

  @Post()
  assign(@Body() dto: CreateInspectionTeamMemberDto) {
    // เรียกใช้ฟังก์ชัน .create() ใน service ใหม่ (ซึ่งข้างในคือโค้ด assign ตัวเดิมของคุณ)
    return this.inspectionTeamMembersService.create(dto);
  }

  @Get('job/:job_id')
  findByJob(@Param('job_id', ParseIntPipe) jobId: number) {
    return this.inspectionTeamMembersService.findByJob(jobId);
  }

  @Get('project/:project_id')
  findByProject(@Param('project_id', ParseIntPipe) projectId: number) {
    return this.inspectionTeamMembersService.findByProject(projectId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionTeamMembersService.remove(id);
  }
}
