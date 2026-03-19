import { Injectable } from '@nestjs/common';
import { CreateInspectionTeamMemberDto } from './dto/create-inspection-team-member.dto';
import { UpdateInspectionTeamMemberDto } from './dto/update-inspection-team-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class InspectionTeamMembersService {
  constructor(
    @InjectRepository(InspectionTeamMember)
    private readonly teamsRepo: Repository<InspectionTeamMember>,
    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,
    @InjectRepository(User)
    private readonly inspectorsRepo: Repository<User>,
  ) {}
  async create(createInspectionTeamMemberDto: CreateInspectionTeamMemberDto) {
    const job = await this.jobsRepo.findOneByOrFail({
      jobId: createInspectionTeamMemberDto.jobId,
    });
    const inspector = await this.inspectorsRepo.findOneByOrFail({
      id: createInspectionTeamMemberDto.inspectorId,
    });
    const team = this.teamsRepo.create({
      ...createInspectionTeamMemberDto,
      job,
      inspector,
    });
    return this.teamsRepo.save(team);
  }

  findAll() {
    return this.teamsRepo.find({
      relations: ['job', 'inspector'],
    });
  }

  findOne(id: number) {
    return this.teamsRepo.findOneOrFail({
      where: { id },
      relations: ['job', 'inspector'],
    });
  }

  async update(id: number, updateDto: UpdateInspectionTeamMemberDto) {
    const member = await this.teamsRepo.findOneByOrFail({ id });

    if (updateDto.jobId) {
      member.job = await this.jobsRepo.findOneByOrFail({
        jobId: updateDto.jobId,
      });
    }

    if (updateDto.inspectorId) {
      member.inspector = await this.inspectorsRepo.findOneByOrFail({
        id: updateDto.inspectorId,
      });
    }

    return this.teamsRepo.save(member);
  }

  async remove(id: number) {
    return this.teamsRepo.softDelete(id);
  }
}
