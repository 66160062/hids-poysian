import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

// เดิมใช้ path 'assignments' ซ้ำกับ InspectionTeamMembersController ซึ่ง register ก่อน
// ทำให้ทุก route ของ controller นี้ไม่เคยถูกเรียกจริง จึงย้ายไป path ของตัวเอง
// (frontend ยังเรียก /assignments ซึ่งคือ inspection-team-members เหมือนเดิม)
@ApiTags('job-assignments')
@ApiBearerAuth()
@UseGuards(AuthGuard, AdminGuard)
@Controller('job-assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  assign(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.assign(dto);
  }

  @Get('job/:job_id')
  findByJob(@Param('job_id', ParseIntPipe) jobId: number) {
    return this.assignmentsService.findByJob(jobId);
  }

  @Get('project/:project_id')
  findByProject(@Param('project_id', ParseIntPipe) projectId: number) {
    return this.assignmentsService.findByProject(projectId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.remove(id);
  }
}
