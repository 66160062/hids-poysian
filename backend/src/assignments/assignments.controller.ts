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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@ApiTags('assignments')
@Controller('assignments')
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
