import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
  ) {}
  create(createTeamDto: CreateTeamDto) {
    const team = this.teamsRepo.create(createTeamDto);
    return this.teamsRepo.save(team);
  }

  findAll() {
    return this.teamsRepo.find();
  }

  findOne(id: number) {
    return this.teamsRepo.findOneByOrFail({ teamId: id });
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.teamsRepo.findOneByOrFail({ teamId: id });
    Object.assign(team, updateTeamDto);
    return this.teamsRepo.save(team);
  }

  remove(id: number) {
    return this.teamsRepo.softDelete(id);
  }
}
