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
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลทีม', type: CreateTeamDto })
  @UseInterceptors(
    FileInterceptor('logo_url', {
      storage: diskStorage({
        destination: './uploads/teams',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.create({
      ...createTeamDto,
      logo_url: file ? '/uploads/teams/' + file.filename : null,
    });
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo_url', {
      storage: diskStorage({
        destination: './uploads/teams',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(+id, {
      ...updateTeamDto,
      logo_url: file ? '/uploads/teams/' + file.filename : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(+id);
  }
}
