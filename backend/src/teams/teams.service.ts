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
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: number;
    all?: boolean | string;
  }) {
    const isAll =
      params?.all === true ||
      params?.all === 'true' ||
      (!params?.page &&
        !params?.limit &&
        !params?.search &&
        !params?.branchId);

    const query = this.teamsRepo
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.branch', 'branch')
      .where('team.status = :status', { status: 'active' })
      .orderBy('team.team_Id', 'DESC');

    if (params?.branchId) {
      query.andWhere('team.branchId = :branchId', {
        branchId: params.branchId,
      });
    }

    if (params?.search && params.search.trim()) {
      query.andWhere(
        '(LOWER(team.team_name) LIKE LOWER(:search) OR team.contact_number LIKE :search)',
        { search: `%${params.search.trim()}%` },
      );
    }

    if (isAll) {
      const data = await query.getMany();
      return {
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        },
      };
    }

    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 9));

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
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
