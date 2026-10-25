import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from 'src/storage/storage.service';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  branchId: number | null;
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}
  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'สร้างผู้ใช้งานใหม่' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลผู้ใช้งาน', type: CreateUserDto })
  @UseInterceptors(FileInterceptor('imageUrl', { storage: memoryStorage() }))
  async create(
    @Req() req: Request & { user: JwtUser },
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    // Branch admin ต้อง assign user เข้าสาขาตัวเองเสมอ
    if (req.user.role === 'admin' && req.user.branchId) {
      createUserDto.branchId = req.user.branchId;
    }
    return this.usersService.create({
      ...createUserDto,
      imageUrl: file
        ? await this.storageService.uploadImage(file.buffer, 'users')
        : '/uploads/users/default-avatar.jpg',
    });
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายชื่อผู้ใช้งานทั้งหมด พร้อมรองรับ pagination / search / filter' })
  findAll(
    @Req() req: Request & { user: JwtUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('branchId') branchId?: string,
    @Query('all') all?: string,
  ) {
    // Branch admin ต้องเห็นเฉพาะสาขาตัวเองเสมอ
    const effectiveBranchId =
      req.user.role === 'admin' && req.user.branchId
        ? req.user.branchId
        : branchId ? Number(branchId) : undefined;

    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      role,
      branchId: effectiveBranchId,
      all,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'อัปเดตข้อมูลผู้ใช้งาน' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ข้อมูลที่ต้องการแก้ไข', type: UpdateUserDto })
  @UseInterceptors(FileInterceptor('imageUrl', { storage: memoryStorage() }))
  async update(
    @Req() req: Request & { user: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updateData = { ...updateUserDto };

    // Branch admin ต้อง lock branchId ของ user ที่แก้ไขเป็นสาขาตัวเองเสมอ
    if (req.user.role === 'admin' && req.user.branchId) {
      updateData.branchId = req.user.branchId;
    }

    if (file) {
      updateData.imageUrl = await this.storageService.uploadImage(
        file.buffer,
        'users',
      );
    }

    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
