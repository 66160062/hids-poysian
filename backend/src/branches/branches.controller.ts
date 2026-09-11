import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { StorageService } from 'src/storage/storage.service';

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchesController {
  constructor(
    private readonly branches: BranchesService,
    private readonly storageService: StorageService,
  ) {}

  @Get() findAll() { return this.branches.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.branches.findOne(+id); }

  @Post()
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async create(@Body() dto: CreateBranchDto, @UploadedFile() logo?: Express.Multer.File) {
    return this.branches.create(dto, logo ? await this.storageService.uploadImage(logo.buffer, 'branches') : undefined);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @UploadedFile() logo?: Express.Multer.File) {
    return this.branches.update(+id, dto, logo ? await this.storageService.uploadImage(logo.buffer, 'branches') : undefined);
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.branches.remove(+id); }
}
