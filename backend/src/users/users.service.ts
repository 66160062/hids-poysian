import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(createUserDto.password, saltOrRounds);
    createUserDto.password = hash;

    if ((createUserDto.teamId as unknown as number) === 0) {
      delete createUserDto.teamId;
    }
    if ((createUserDto.branchId as unknown as number) === 0) {
      delete createUserDto.branchId;
    }

    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    branchId?: number;
    all?: boolean | string;
  }) {
    const isAll =
      params?.all === true ||
      params?.all === 'true' ||
      (!params?.page &&
        !params?.limit &&
        !params?.search &&
        !params?.role &&
        !params?.branchId);

    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.team', 'team')
      .leftJoinAndSelect('team.branch', 'teamBranch')
      .leftJoinAndSelect('user.branch', 'branch')
      .orderBy('user.id', 'DESC');

    if (params?.role && params.role !== 'all') {
      query.andWhere('user.role = :role', { role: params.role });
    }

    if (params?.branchId) {
      query.andWhere(
        '(user.branchId = :branchId OR team.branch_id = :branchId)',
        { branchId: params.branchId },
      );
    }

    if (params?.search && params.search.trim()) {
      query.andWhere(
        '(LOWER(user.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR user.phoneNumber LIKE :search)',
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

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['team', 'team.branch', 'branch'],
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['team', 'team.branch', 'branch'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      const saltOrRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltOrRounds,
      );
    } else {
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);

    // branchId handling:
    // If branchId is provided, parse number and clear user.branch relation cache
    if (updateUserDto.branchId !== undefined) {
      const bId = Number(updateUserDto.branchId);
      user.branchId = bId === 0 ? null : bId;
      user.branch = null;
    }

    // teamId handling:
    // If teamId is provided, parse number and clear user.team relation cache
    if (updateUserDto.teamId !== undefined) {
      const tId = Number(updateUserDto.teamId);
      user.teamId = tId === 0 ? null : tId;
      user.team = null;
    }

    // If role is admin, they shouldn't belong to a team
    if (user.role === 'admin') {
      user.teamId = null;
      user.team = null;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    return this.usersRepository.softRemove(user);
  }
}
