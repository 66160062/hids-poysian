import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from 'src/auth/auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get() findAll() { return this.branches.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.branches.findOne(+id); }

  @Post()
  @UseInterceptors(FileInterceptor('logo', { storage: diskStorage({ destination: './uploads/branches', filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`) }) }))
  create(@Body() dto: CreateBranchDto, @UploadedFile() logo?: Express.Multer.File) {
    return this.branches.create(dto, logo ? `/uploads/branches/${logo.filename}` : undefined);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo', { storage: diskStorage({ destination: './uploads/branches', filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`) }) }))
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @UploadedFile() logo?: Express.Multer.File) {
    return this.branches.update(+id, dto, logo ? `/uploads/branches/${logo.filename}` : undefined);
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.branches.remove(+id); }
}
