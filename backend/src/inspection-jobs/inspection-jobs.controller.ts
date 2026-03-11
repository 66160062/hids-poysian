import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { CreateInspectionJobDto } from './dto/create-inspection-job.dto';
import { UpdateInspectionJobDto } from './dto/update-inspection-job.dto';

@Controller('inspection-jobs')
export class InspectionJobsController {
  constructor(private readonly inspectionJobsService: InspectionJobsService) {}

  @Post()
  create(@Body() createInspectionJobDto: CreateInspectionJobDto) {
    return this.inspectionJobsService.create(createInspectionJobDto);
  }

  @Get()
  findAll() {
    return this.inspectionJobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionJobsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInspectionJobDto: UpdateInspectionJobDto) {
    return this.inspectionJobsService.update(+id, updateInspectionJobDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionJobsService.remove(+id);
  }
}
