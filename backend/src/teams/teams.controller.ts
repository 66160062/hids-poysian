import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from 'src/storage/storage.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  branchId: number | null;
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลทีม', type: CreateTeamDto })
  @UseInterceptors(FileInterceptor('logo_url', { storage: memoryStorage() }))
  async create(
    @Req() req: Request & { user: JwtUser },
    @UploadedFile() file: Express.Multer.File,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    if (req.user?.role === 'admin' && req.user?.branchId) {
      createTeamDto.branchId = req.user.branchId;
    }

    return this.teamsService.create({
      ...createTeamDto,
      logo_url: file
        ? await this.storageService.uploadImage(file.buffer, 'teams')
        : null,
    });
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายชื่อทีมทั้งหมด พร้อมรองรับ pagination / search / filter' })
  findAll(
    @Req() req: Request & { user: JwtUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('all') all?: string,
  ) {
    const effectiveBranchId =
      req.user?.role === 'admin' && req.user?.branchId
        ? req.user.branchId
        : branchId ? Number(branchId) : undefined;

    return this.teamsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      branchId: effectiveBranchId,
      all,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo_url', { storage: memoryStorage() }))
  async update(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    if (req.user?.role === 'admin' && req.user?.branchId) {
      updateTeamDto.branchId = req.user.branchId;
    }

    return this.teamsService.update(+id, {
      ...updateTeamDto,
      logo_url: file
        ? await this.storageService.uploadImage(file.buffer, 'teams')
        : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(+id);
  }
}
