import { Injectable } from '@nestjs/common';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Between, Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';

@Injectable()
export class InspectionRoundsService {
  constructor(
    @InjectRepository(InspectionRound)
    private readonly inspectionRoundsRepo: Repository<InspectionRound>,
    @InjectRepository(InspectionJob)
    private readonly inspectionJobsRepo: Repository<InspectionJob>,
    @InjectRepository(InspectionTeamMember)
    private readonly teamMembersRepo: Repository<InspectionTeamMember>,
  ) {}

  async create(createInspectionRoundDto: CreateInspectionRoundDto) {
    const job = await this.inspectionJobsRepo.findOneByOrFail({
      jobId: createInspectionRoundDto.jobId,
    });

    const teamMember = await this.teamMembersRepo.findOneByOrFail({
      id: createInspectionRoundDto.teamMemberId,
    });

    const round = this.inspectionRoundsRepo.create({
      ...createInspectionRoundDto,
      job,
      teamMember,
    });

    return this.inspectionRoundsRepo.save(round);
  }

  findAll() {
    return this.inspectionRoundsRepo.find();
  }

  findOne(id: number) {
    return this.inspectionRoundsRepo.findOneByOrFail({ roundId: id });
  }

  async findByWeek(inspectorId: number) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.inspectionRoundsRepo.find({
      where: {
        scheduledDate: Between(startOfWeek, endOfWeek),
        teamMember: { inspector: { id: inspectorId } },
      },
      relations: ['job', 'job.customer', 'job.address', 'job.houseType'],
    });
  }

  async update(id: number, updateInspectionRoundDto: UpdateInspectionRoundDto) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    Object.assign(round, updateInspectionRoundDto);
    return this.inspectionRoundsRepo.save(round);
  }

  async remove(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    return this.inspectionRoundsRepo.softRemove(round);
  }
}
