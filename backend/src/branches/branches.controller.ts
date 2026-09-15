import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

const logoFilePipe = new ParseFilePipe({
  fileIsRequired: false,
  validators: [
    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
  ],
});

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  findAll() {
    return this.branches.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branches.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  create(
    @Body() dto: CreateBranchDto,
    @UploadedFile(logoFilePipe) logo?: Express.Multer.File,
  ) {
    return this.branches.create(dto, logo);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
    @UploadedFile(logoFilePipe) logo?: Express.Multer.File,
  ) {
    return this.branches.update(id, dto, logo);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branches.remove(id);
  }
}
