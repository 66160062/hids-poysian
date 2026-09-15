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
import { RepairRecordsService } from './repair-records.service';
import { CreateRepairRecordDto } from './dto/create-repair-record.dto';
import { UpdateRepairRecordDto } from './dto/update-repair-record.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService } from 'src/storage/storage.service';

@ApiTags('Repair Records') // จัดกลุ่มใน Swagger
@Controller('repair-records')
export class RepairRecordsController {
  constructor(
    private readonly repairRecordsService: RepairRecordsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'บันทึกการซ่อมใหม่' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createRepairRecordDto: CreateRepairRecordDto,
  ) {
    // ส่งข้อมูลเข้า Service พร้อมจัดการ Path รูปภาพและขนาดไฟล์
    return this.repairRecordsService.create({
      ...createRepairRecordDto,
      imageUrl: file
        ? await this.storageService.uploadImage(file.buffer, 'repair_records')
        : '/uploads/repair_records/default.jpg',
      fileSize: file ? file.size : 0,
    });
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการบันทึกการซ่อมทั้งหมด' })
  findAll() {
    return this.repairRecordsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียดการซ่อมรายรายการ' })
  findOne(@Param('id') id: string) {
    return this.repairRecordsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตบันทึกการซ่อม' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateRepairRecordDto: UpdateRepairRecordDto,
  ) {
    return this.repairRecordsService.update(+id, {
      ...updateRepairRecordDto,
      imageUrl: file
        ? await this.storageService.uploadImage(file.buffer, 'repair_records')
        : undefined,
      fileSize: file ? file.size : undefined,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบบันทึกการซ่อม (Soft Delete)' })
  remove(@Param('id') id: string) {
    return this.repairRecordsService.remove(+id);
  }
}
