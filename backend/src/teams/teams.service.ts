import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}
  create(createTeamDto: CreateTeamDto) {
    const team = this.teamsRepo.create(createTeamDto);
    return this.teamsRepo.save(team);
  }

  // เฉพาะทีมที่ active เท่านั้นที่แสดงในหน้า admin
  findAll() {
    return this.teamsRepo.find({
      where: { status: 'active' },
      relations: ['branch'],
      order: {
        team_Id: 'DESC',
      },
    });
  }

  findOne(id: number) {
    return this.teamsRepo.findOneOrFail({
      where: { team_Id: id },
      relations: ['branch'],
    });
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.teamsRepo.findOneByOrFail({ team_Id: id });
    Object.assign(team, updateTeamDto);

    // branchId: 0 is a sentinel from the frontend meaning "unassign branch"
    // (multipart/form-data can't carry a real null; 0 is never a valid branch id)
    if ((updateTeamDto.branchId as unknown as number) === 0) {
      team.branchId = null;
    }

    return this.teamsRepo.save(team);
  }

  // ไม่ลบแถวทีมจริงๆ แค่เปลี่ยนสถานะเป็น inactive เพื่อให้ round ตรวจ/ประวัติเก่า
  // ที่อ้างอิง team_id นี้อยู่ (ผ่าน inspection_team_member) ยังคงเชื่อมโยงได้ปกติ
  // และถอดสมาชิกทุกคนออกจากทีมนี้ เพื่อไม่ให้มีสมาชิกค้างอยู่ในทีมที่มองไม่เห็นแล้ว
  async remove(id: number) {
    const team = await this.teamsRepo.findOneByOrFail({ team_Id: id });
    team.status = 'inactive';
    await this.usersRepo.update({ teamId: id }, { teamId: null as any });
    return this.teamsRepo.save(team);
  }
}
