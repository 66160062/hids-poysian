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
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from 'src/storage/storage.service';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลทีม', type: CreateTeamDto })
  @UseInterceptors(FileInterceptor('logo_url', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTeamDto: CreateTeamDto,
  ) {
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('all') all?: string,
  ) {
    return this.teamsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      branchId: branchId ? Number(branchId) : undefined,
      all,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo_url', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(+id, {
      ...updateTeamDto,
      logo_url: file
        ? await this.storageService.uploadImage(file.buffer, 'teams')
        : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(+id);
  }
}
