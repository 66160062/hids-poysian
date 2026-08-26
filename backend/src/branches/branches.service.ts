import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Team } from 'src/teams/entities/team.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    @InjectRepository(Team) private readonly teams: Repository<Team>,
  ) {}

  findAll() {
    return this.branches.find({ where: { status: 'active' }, order: { branchName: 'ASC' } });
  }

  async findOne(id: number) {
    const branch = await this.branches.findOneBy({ branchId: id });
    if (!branch) throw new NotFoundException(`ไม่พบบริษัท/สาขา ID ${id}`);
    return branch;
  }

  async findOrCreateForTeam(teamId: number): Promise<Branch> {
    const team = await this.teams.findOneBy({ team_Id: teamId });
    if (!team || team.status !== 'active') throw new NotFoundException(`ไม่พบทีมตรวจ ID ${teamId}`);
    const existing = await this.branches.findOneBy({ teamId });
    if (existing) {
      Object.assign(existing, { branchName: team.team_name, logoUrl: team.logo_url, status: 'active' });
      return this.branches.save(existing);
    }
    return this.branches.save(this.branches.create({ teamId, team, branchName: team.team_name, logoUrl: team.logo_url, status: 'active' }));
  }

  create(dto: CreateBranchDto, logoUrl?: string) {
    return this.branches.save(this.branches.create({ ...dto, logoUrl: logoUrl ?? null, status: dto.status ?? 'active' }));
  }

  async update(id: number, dto: UpdateBranchDto, logoUrl?: string) {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    if (logoUrl) branch.logoUrl = logoUrl;
    return this.branches.save(branch);
  }

  async remove(id: number) {
    const branch = await this.findOne(id);
    branch.status = 'inactive';
    return this.branches.save(branch);
  }
}
